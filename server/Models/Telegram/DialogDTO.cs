using TL;
namespace ChatHub.Models.Telegram.DTO;

public struct DialogDTO
{
    public readonly long Id { get; }
    public readonly string Title { get;}
    public readonly string MainUsername { get; }
    public readonly long PhotoId { get; }
    public string Message { get; set; }

    public DialogDTO(long id, string title, string tag, long photoId = 0)
    {
        Id = id;
        Title = title;
        PhotoId = photoId;
        MainUsername = tag;
    }
}