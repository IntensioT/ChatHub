using ChatHub.Models.Telegram;
using ChatHub.Models.Telegram.DTO;
using Microsoft.AspNetCore.SignalR;
using server.HubR;
using TL;

namespace ChatHub.Services.Telegram;

public class WClientTLService : ITLService
{
    readonly WTelegram.Client _client = null!;
    readonly WTelegram.UpdateManager _manager = null!;

    long lastDialogId = 0;
    User _user => _client.User;
    Messages_Dialogs? _dialogs;

    private IPeerInfo User(long id) => _manager.Users[id];
    private IPeerInfo Chat(long id) => _manager.Chats[id];
    private IPeerInfo Peer(Peer? peer) => _manager.UserOrChat(peer);
    readonly IHubContext<ChatHubR> _chatHub;
    bool IsLoggedIn => _client.User != null;

    readonly ILogger<WClientTLService> _logger;
    readonly IMapper _mapper;

    public WClientTLService(
        ILogger<WClientTLService> logger,
        IMapper mapper,
        IHubContext<ChatHubR> chatHub,
        int api_id,
        string api_hash
    )
    {

        _client = new WTelegram.Client(api_id, api_hash);
        _manager = _client.WithUpdateManager(OnUpdate);
        WTelegram.Helpers.Log = (lvl, msg) => logger.Log((LogLevel)lvl, msg);
        _chatHub = chatHub;
        _logger = logger;
        _mapper = mapper;

        var phone = Environment.GetEnvironmentVariable("TELEGRAM_API_PHONE");
        if (!String.IsNullOrEmpty(phone))
            Task.WaitAll(Task.Run(async () => await Login(phone)));
    }



    public async Task<TLResponse> Login(string loginInfo)
    {
        string GetResponseMessage(string info) =>
            info switch
            {
                "verification_code" => "Send verification code",
                "name" => "Sign up is required (first/last name)",
                "password" => "Enter your password",
                _ => $"Pending case {info}"
            };
        var result = new TLResponse();

        try
        {
            if (_user == null)
            {
                result.Message = GetResponseMessage(await _client.Login(loginInfo));

                if (_user != null)
                {
                    result.Message = $"User {_user} (id {_user.id}) is successfully logged-in";
                    _dialogs = await _client.Messages_GetAllDialogs();
                    _dialogs.CollectUsersChats(_manager.Users, _manager.Chats);
                }
            }
            else
                result.Message = $"User {_user} (id {_user.id}) is already logged-in";
        }

        catch (RpcException e)
        {
            result.StatusCode = e.Code;
            result.Message = e.Message;
            await Logout();
        }

        return result;
    }

    public async Task<TLResponse> Logout()
    {
        var logout = await _client.Auth_LogOut();
        _client.Reset(true, false);
        return new TLResponse($"User {_user} logout");
    }

    public async Task<TLResponse> GetMessages(long peerId, int offset, int limit)
    {
        if (!IsLoggedIn)
            return new TLResponse(StatusCodes.Status401Unauthorized, "Undefiend user");
        if (_dialogs == null)
            _dialogs = await UpdateDialogs();

        var response = new TLResponse();
        var peer = GetPeerFromDialogs(_dialogs, peerId);

        if (peer != null)
        {
            if (peer is User user)
                response.Data = await GetMessagesFromPeer(user, offset, limit);
            else if (peer is ChatBase channel)
                response.Data = await GetMessagesFromPeer(channel, offset, limit);
            else
                _logger.LogWarning($"Unsupported peer type: {peer.GetType().Name}");
        }
        return response;
    }

    private async Task<List<MessageDTO>> GetMessagesFromPeer(InputPeer peer, int offset, int limit)
    {
        var result = new List<MessageDTO>();
        var messages = await _client.Messages_GetHistory(peer, add_offset: offset, limit: limit);
        foreach (var msgBase in messages.Messages)
        {
            messages.CollectUsersChats(_manager.Users, _manager.Chats);
            result.Add(CreateMessageDTO(msgBase));
        }
        return result;
    }

    private IPeerInfo? GetPeerFromDialogs(Messages_Dialogs dialogs, long peerId)
    {
        if (dialogs.users.ContainsKey(peerId))
            return dialogs.users[peerId];
        else if (dialogs.chats.ContainsKey(peerId))
            return dialogs.chats[peerId];
        else
            return null;
    }

    public async Task<TLResponse> GetAllDialogs()
    {
        if (!IsLoggedIn)
            return new TLResponse(StatusCodes.Status401Unauthorized, "Undefiend user");
        if (_dialogs == null)
            _dialogs = await UpdateDialogs();

        var result = new TLResponse(StatusCodes.Status200OK, "Get dialogs");
        var list = new List<DialogDTO>();
        foreach (Dialog dialog in _dialogs.dialogs)
        {
            var dto = await CreateDialogDTO(dialog);
            if (dto.Id > 0)
                list.Add(dto);
        }
        lastDialogId = list[0].Id;
        result.Data = list;
        return result;
    }

    private PeerDTO? CreatePeerDTO(IPeerInfo? peer) =>
        peer switch
        {
            User u => _mapper.Map<PeerDTO>(u),
            ChatBase cb => _mapper.Map<PeerDTO>(cb),
            _ => null //throw new InvalidCastException($"Cant find peer type: {peer?.GetType()}")
        };

    private long GetPhotoIdByPeer(IPeerInfo info)
    {
        long id = 0;
        switch (info)
        {
            case User u:
                if (u.photo is UserProfilePhoto userPhoto)
                    id = userPhoto.photo_id;
                break;
            case ChatBase chat:
                if (chat.Photo is ChatPhoto chatPhoto)
                    id = chatPhoto.photo_id;
                break;
        }
        return id;
    }

    private MessageDTO CreateMessageDTO(MessageBase message)
    {
        var result = new MessageDTO();
        switch (message)
        {
            case Message m:
                result = _mapper.Map<MessageDTO>(m);
                break;
            case MessageService ms:
                result = _mapper.Map<MessageDTO>(ms);
                break;
            default:
                throw new InvalidCastException($"Cant find message type: {message.GetType()}");
        }
        result.Sender = CreatePeerDTO(Peer(message?.From ?? message?.Peer));
        return result;
    }

    private async Task<DialogDTO> CreateDialogDTO(Dialog dialog)
    {
        if (_dialogs == null)
            _dialogs = await UpdateDialogs();

        DialogDTO result = new();
        switch (Peer(dialog.Peer))
        {
            case User user when user.IsActive:
                result = _mapper.Map<DialogDTO>(user);
                break;
            case ChatBase chat when chat.IsActive:
                result = _mapper.Map<DialogDTO>(chat);
                break;
        }
        var topMessage = _dialogs
            .Messages
            .First(m => m.Peer.ID == dialog.peer.ID && m.ID == dialog.TopMessage);
        result.TopMessage = CreateMessageDTO(topMessage);

        return result;
    }

    public async Task<TLResponse> SendMessage(long peerId, string message)
    {
        if (!IsLoggedIn)
            return new TLResponse(StatusCodes.Status401Unauthorized, "Undefiend user");
        if (_dialogs == null)
            _dialogs = await UpdateDialogs();

        var response = new TLResponse($"undefiend {peerId}");
        IPeerInfo? peer = GetPeerFromDialogs(_dialogs, peerId);
        if (peer != null)
        {
            switch (peer)
            {
                case User u:
                    response.Data = CreateMessageDTO(await _client.SendMessageAsync(u, message));
                    response.Message = $"Send to {u.MainUsername}";
                    break;
                case ChatBase cb:
                    response.Data = CreateMessageDTO(await _client.SendMessageAsync(cb, message));
                    response.Message = $"Send to {cb.MainUsername}";
                    break;
            }
        }
        return response;
    }

    private async Task OnUpdate(Update update)
    {
        switch (update)
        {
            case UpdateNewMessage unm:
            case UpdateEditMessage uem:
            case UpdateDeleteChannelMessages udcm:
            case UpdateDeleteMessages udm:
            case UpdateUserTyping uut:
            case UpdateChatUserTyping ucut:
            case UpdateChannelUserTyping ucut2:
            case UpdateChatParticipants { participants: ChatParticipants cp }:
            case UpdateUserStatus uus:
            case UpdateUserName uun:
            case UpdateUser uu:
                    await SendUpdatedMessages();
                    await UpdateDialogs();
                    await SendUpdatedDialogs();
                break;
            default:
                break; // there are much more update types than the above example cases
        }
    }

    private async Task SendUpdatedMessages()
    {
        var messages = await GetMessages(lastDialogId, 0, 20);
        await ChatHubR.UpdateMessagesTL(_chatHub, messages.Data);
        _logger.Log(LogLevel.Information, "Updated messages were sended");
    }

    private async Task SendUpdatedDialogs()
    {
        var dialogs = await GetAllDialogs();
        await ChatHubR.UpdateDialogsTL(_chatHub, dialogs.Data);
        _logger.Log(LogLevel.Information, "Updated dialogs were sended");

    }
    private async Task<TL.Messages_Dialogs> UpdateDialogs()
    {
        _dialogs = await _client.Messages_GetAllDialogs();
        _dialogs.CollectUsersChats(_manager.Users, _manager.Chats);
        return _dialogs;
    }

}
