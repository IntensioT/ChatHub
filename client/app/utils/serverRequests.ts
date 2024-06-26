import { IMessageInfo } from "../models/dto/IMessageInfo";
import { IDialogInfo } from "../models/dto/IDialogInfo";

import { IMessageInfoVK } from "../vkontakte/dto/IMessageInfo";
import { IDialogInfoVK } from "../vkontakte/dto/IDialogInfo";
import ResponseDTO from "../models/responseDTO";
import UserInfo from "../models/userInfo";
import { deleteCookie, navigate, setCookie } from "./browserUtils";
import { SendRequestData } from "../models/sendRequest";
import MessengerResponse from "../models/dto/TLResponse";

export async function logoutRequest(messenger: string) {
    let keys = Object.keys(localStorage);
    keys.forEach((key) => {
        if (key.includes(messenger)) {
            localStorage.removeItem(key);
        }
    });
    deleteCookie(`${messenger}_id`);
    await fetch(`http://localhost:5041/api/v1.0/${messenger}/logout`);
}

//if user want to do smthing before redirect set this flag to false
export async function loginRequest(
    messenger: string,
    url: string,
    withNavigate: boolean = true    
): Promise<boolean> {
    const response = await fetch(
        url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    if (!response.ok) {
        throw new Error("Unable to login");
    }
    const result: ResponseDTO = await response.json();
    if (result.data == null) {
        return false;
    }

    if (result.statusCode == 200) {
        let data = result.data as UserInfo;
        localStorage.setItem(`${messenger}_username`, data.username.toString());
        localStorage.setItem(`${messenger}_tag`, data.tag);
        localStorage.setItem(`${messenger}_photoUrl`, data.photoUrl.toString());
        localStorage.setItem(`${messenger}_id`, data.id.toString());

        const oneDay = 24 * 60 * 60 * 1000;
        setCookie(`${messenger}_id`, data.id.toString(), { maxAge: 100 * oneDay });
        if(withNavigate) {
            navigate(`/${messenger}`);
        }
    }
    return true;
}

export async function GetMessages(
    dialogId: number,
    offset: number,
    limit: number,
): Promise<IMessageInfo[]> {
    const url = "http://localhost:5041/api/v1.0/telegram/peers";
    let messages = [];

    try {
        const res = await fetch(
            `${url}/${dialogId}?offset=${offset}&limit=${limit}`,
        );
        if (!res.ok) {
            throw new Error("Unable to get telegram dialogs data");
        }
        messages = await res.json();
    } catch (error) {
        console.error(error);
    } finally {
        return messages.data;
    }
}

export async function GetDialogs(
    messenger: string,
): Promise<IDialogInfo[] | null> {
    let dialogs: ResponseDTO | null = null;
    try {
        const res = await fetch(
            `http://localhost:5041/api/v1.0/${messenger}/dialogs`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                },
            },
        );
        if (!res.ok) {
            throw new Error("Unable to get telegram dialogs data");
        }
        dialogs = await res.json();

        if (!dialogs || dialogs.statusCode == 401) {
            navigate(`/${messenger}/authorization`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        return dialogs ? dialogs.data as IDialogInfo[] : null;
    }
}

export async function GetMessagesVK(
    dialogId: number,
    offset: number,
    limit: number,
): Promise<IMessageInfoVK[]> {
    const url = "http://localhost:5041/api/v1.0/vk/peers";
    let messages = [];

    try {
        const res = await fetch(
            `${url}/${dialogId}?offset=${offset}&limit=${limit}`,
        );
        if (!res.ok) {
            throw new Error("Unable to get vk dialogs data");
        }
        messages = await res.json();
    } catch (error) {
        console.error(error);
    } finally {
        return messages.data;
    }
}

export async function GetDialogsVK(
    offset: number,
    limit: number,
): Promise<IDialogInfoVK[]> {
    let dialogs = [];
    try {
        const res = await fetch(
            `http://localhost:5041/api/v1.0/vk/dialogs?offsetId=${offset}&limit=${limit}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                },
            },
        );
        if (!res.ok) {
            throw new Error("Unable to get vk dialogs data");
        }
        dialogs = await res.json();
    } catch (error) {
        console.error(error);
    } finally {
        return dialogs.data;
    }
}

export async function sendMessage(
    messenger: string,
    chatId: number,
    sendData: SendRequestData,
): Promise<IMessageInfo | undefined> {
    var response = await fetch(
        `http://localhost:5041/api/v1.0/${messenger}/peers/${chatId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sendData),
        },
    );
    if (response.ok) {
        let message: MessengerResponse = await response.json();
        return message.data as IMessageInfo;
    }
    return undefined;
}
