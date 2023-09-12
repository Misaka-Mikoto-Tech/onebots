import {Message, OnlineStatus} from "icqq";
import {OneBotStatus} from "@/onebot";
import {V11} from "@/service/V11";

export class CommonAction {
    /**
     * 获取登录信息
     */
    getLoginInfo(this: V11) {
        return {
            user_id: this.oneBot.uin,
            nickname: this.client.nickname
        }
    }

    /**
     * 撤回消息
     * @param message_id {string} 消息id
     */
    deleteMsg(this: V11, message_id: string) {
        return this.client.deleteMsg(message_id)
    }

    /**
     * 获取消息
     * @param message_id {string} 消息id
     */
    async getMsg(this: V11, message_id: number) {
        const messageId= String((await this.db.getMsgById(message_id)).id) // 从本地数据库查找出id对应的 base64_id
        let msg: Message = await this.client.getMsg(messageId)
        msg.message_id = messageId  // nonebot v11 要求 message_id 是 number 类型
        if(!msg["real_id"])         // nonebot 的reply要求real_id字段，虽然它从未使用
            msg["real_id"] = msg.message_id
        return msg
    }


    /**
     * 获取合并消息
     * @param id {string} 合并id
     */
    getForwardMsg(this: V11, id: string) {
        return this.client.getForwardMsg(id)
    }

    /**
     * 获取 Cookies
     * @param domain {string} 域名
     */
    getCookies(this: V11, domain: string) {
        return this.client.cookies[domain]
    }

    /**
     * 获取 CSRF Token
     */
    getCsrfToken(this: V11) {
        return this.client.getCsrfToken()
    }

    /**
     * 获取 QQ 相关接口凭证
     * @param domain
     */
    getCredentials(this: V11, domain: string) {
        return {
            cookies: this.client.cookies[domain],
            csrf_token: this.client.getCsrfToken()
        }
    }

    /**
     * 获取版本信息
     */
    getVersion(this: V11) {
        return {
            app_name: 'icqq',
            app_version: '2.x',
            protocol_version: 'v11'
        }
    }

    /**
     * 重启OneBot实现
     * @param delay {number} 要延迟的毫秒数
     */
    setRestart(this: V11, delay: number) {
        return this.emit('restart', delay)
    }

    getStatus(this: V11) {
        return {
            online: this.client.status === OnlineStatus.Online,
            good: this.oneBot.status === OneBotStatus.Good
        }
    }

    callLogin(this: V11, func: string, ...args: any[]) {
        return new Promise(async resolve => {
            const receiveResult = (event) => {
                this.client.offTrap('system.login.qrcode')
                this.client.offTrap('system.login.device')
                this.client.offTrap('system.login.slider')
                this.client.offTrap('system.login.error')
                resolve(event)
            }
            this.client.trap('system.login.qrcode', receiveResult)
            this.client.trap('system.login.device', receiveResult)
            this.client.trap('system.login.slider', receiveResult)
            this.client.trap('system.login.error', receiveResult)
            this.client.trapOnce('system.online', receiveResult)
            try {
                await this.client[func](...args)
            } catch (reason) {
                receiveResult(reason)
            }
        })
    }

    async submitSlider(this: V11, ticket: string) {
        return this.action.callLogin.apply(this, ['submitSlider', ticket])
    }

    async submitSmsCode(this: V11, code: string) {
        return this.action.callLogin.apply(this, ['submitSmsCode', code])
    }

    sendSmsCode(this: V11) {
        return new Promise<any>(resolve => {
            const receiveResult = (e) => {
                const callback = (data) => {
                    this.client.offTrap('internal.verbose')
                    this.client.offTrap('system.login.error')
                    resolve(data)
                }
                if ((typeof e === 'string' && e.includes('已发送')) || typeof e !== 'string') {
                    callback(e)
                }
            }
            this.client.trap('internal.verbose', receiveResult)
            this.client.trap('system.login.error', receiveResult)
            this.client.sendSmsCode()
        })
    }

    login(this: V11, password?: string) {
        return this.action.callLogin.apply(this, ['login', password])
    }

    logout(this: V11, keepalive?: boolean) {
        return new Promise(async resolve => {
            const receiveResult = (e) => {
                this.client.offTrap('system.offline')
                resolve(e)
            }
            this.client.trap('system.offline', receiveResult)
            await this.client.logout(keepalive)
        })
    }
}
