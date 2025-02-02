import { OneBotStatus } from "@/onebot"
import { V11 } from "@/service/V11"
import { Message, OnlineStatus } from "icqq"

export class CommonAction {
    /**
     * 获取登录信息
     */
    getLoginInfo(this: V11) {
        return {
            user_id: this.oneBot.uin,
            nickname: this.adapter.getSelfInfo(this.oneBot.uin,'V11').nickname
        }
    }

    /**
     * 撤回消息
     * @param message_id {string} 消息id
     */
    async deleteMsg(this: V11, message_id: number) {
        if(message_id == 0) throw new Error('getMsg: message_id[0] is invalid')
        let msg_entry = await this.db.getMsgById(message_id)
        if(!msg_entry) throw new Error(`getMsg: can not find msg[${message_id}] in db`)

        return this.adapter.call(this.oneBot.uin,'V11','deleteMsg',[msg_entry.base64_id])
    }

    /**
     * 获取消息
     * @param message_id {string} 消息id
     * @param onebot_id {number}
     */
    async getMsg(this: V11, message_id: number) {
        if(message_id == 0) throw new Error('getMsg: message_id[0] is invalid')
        let msg_entry = await this.db.getMsgById(message_id)
        if(!msg_entry) throw new Error(`getMsg: can not find msg[${message_id}] in db`)

        let msg: Message = await this.adapter.call(this.oneBot.uin,'V11','getMsg',[msg_entry.base64_id])
        msg.message_id = String(message_id)  // nonebot v11 要求 message_id 是 number 类型
        msg["real_id"] = msg.message_id      // nonebot 的reply类型会检测real_id是否存在，虽然它从未使用
        return msg
    }

    /**
     * 获取合并消息
     * @param id {string} 合并id
     */
    getForwardMsg(this: V11, id: string) {
        return this.adapter.call(this.oneBot.uin,'V11','getForwardMsg',[id])
    }

    /**
     * 获取 Cookies
     * @param domain {string} 域名
     */
    getCookies(this: V11, domain: string) {
        return this.adapter.call['getCookies']([domain])
    }

    /**
     * 获取 CSRF Token
     */
    getCsrfToken(this: V11) {
        return this.adapter.call(this.oneBot.uin,'V11','getCsrfToken')
    }

    /**
     * 获取 QQ 相关接口凭证
     * @param domain
     */
    getCredentials(this: V11, domain: string) {
        return {
            cookies: this.adapter.call(this.oneBot.uin,'V11','getCookies',[domain]),
            csrf_token: this.adapter.call(this.oneBot.uin,'V11','getCsrfToken')
        }
    }

    /**
     * 获取版本信息
     */
    getVersion(this: V11) {
        return {
            app_name: "icqq",
            app_version: "2.x",
            protocol_version: "v11",
        }
    }

    /**
     * 重启OneBot实现
     * @param delay {number} 要延迟的毫秒数
     */
    setRestart(this: V11, delay: number) {
        return this.emit("restart", delay)
    }

    getStatus(this: V11) {
        return {
            online: this.adapter.getSelfInfo(this.oneBot.uin,'V11').status === OneBotStatus.Online,
            good: this.oneBot.status === OneBotStatus.Good
        }
    }


    async submitSlider(this: V11, ticket: string) {
        return this.adapter.call(this.oneBot.uin,'V11','callLogin',['submitSlider', ticket])
    }

    async submitSmsCode(this: V11, code: string) {
        return this.adapter.call(this.oneBot.uin,'V11','callLogin', ['submitSmsCode', code])
    }

    login(this: V11, password?: string) {
        return this.adapter.call(this.oneBot.uin,'V11','callLogin', ['login', password])
    }

    logout(this: V11, keepalive?: boolean) {
        return this.adapter.call(this.oneBot.uin,'V11','logout', [keepalive])
    }
}
