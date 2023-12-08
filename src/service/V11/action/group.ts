import { V11 } from "@/service/V11"
import { processMessage } from "@/service/V11/utils"
import { shareMusic } from "@/service/shareMusicCustom"
import { createQuotableFromMsgId } from "@/utils"
import { MessageElem, MusicElem } from "icqq/lib/message"

export class GroupAction {
    /**
     * 发送群聊消息
     * @param group_id {number} 群id
     * @param message {MessageElem[]} 消息
     * @param message_id {string} 引用的消息ID
     */
    async sendGroupMsg(this: V11, group_id: number, message: MessageElem[], message_id?: string) {
        const msg = message_id ? await this.client.getMsg(message_id) : undefined
        const tmpQuote = (message_id && !msg) ? createQuotableFromMsgId(message_id) : undefined
        const { element, music, share } = await processMessage.apply(this.client, [message])
        if (music) return await shareMusic.call(this.client.pickGroup(group_id), music as MusicElem)
        if (share) return await this.client.pickGroup(group_id).shareUrl(music.data)
        if (!element.length) throw new Error("Empty message")
        return await this.client.sendGroupMsg(group_id, element, msg || tmpQuote)
    }

    /**
     * 群组踢人
     * @param group_id {number} 群id
     * @param user_id {number} 成员id
     * @param reject_add_request {boolean} 是否禁止此人加群请求
     */
    setGroupKick(this: V11, group_id: number, user_id: number, reject_add_request?: boolean) {
        return this.client.setGroupKick(group_id, user_id, reject_add_request)
    }

    /**
     * 群禁言指定人
     * @param group_id {number} 群id
     * @param user_id {number} 成员id
     * @param duration {number} 禁言时长(单位：秒)
     */
    setGroupBan(this: V11, group_id: number, user_id: number, duration: number = 1800) {
        return this.client.setGroupBan(group_id, user_id, duration)
    }

    /**
     * 群禁言匿名者
     * @param group_id {number} 群id
     * @param flag {string} 匿名者flag
     * @param duration {number} 禁言时长(单位：秒)
     */
    setGroupAnonymousBan(this: V11, group_id: number, flag: string, duration: number = 1800) {
        return this.client.setGroupAnonymousBan(group_id, flag, duration)
    }

    /**
     * 群全体禁言
     * @param group_id {number} 群id
     * @param enable {boolean} 是否禁言
     */
    setGroupWholeBan(this: V11, group_id: number, enable?: boolean) {
        return this.client.setGroupWholeBan(group_id, enable)
    }

    /**
     * 群匿名聊天
     * @param group_id {number} 群id
     * @param enable {boolean} 是否开启
     */
    setGroupAnonymous(this: V11, group_id: number, enable?: boolean) {
        return this.client.setGroupAnonymous(group_id, enable)
    }

    /**
     * 设置群管
     * @param group_id {number} 群id
     * @param user_id {number} 成员id
     * @param enable {boolean} true 设为管理，false 取消管理
     */
    setGroupAdmin(this: V11, group_id: number, user_id: number, enable?: boolean) {
        return this.client.setGroupAdmin(group_id, user_id, enable)
    }

    /**
     * 设置群成员名片(成员备注)
     * @param group_id {number} 群id
     * @param user_id {number} 成员id
     * @param card {string} 名片信息，不传或传空串则为 删除名片
     */
    setGroupCard(this: V11, group_id: number, user_id: number, card?: string) {
        return this.client.setGroupCard(group_id, user_id, card)
    }

    /**
     * 设置群精华
     * @param message_id 消息id
     */
    setEssenceMessage(this: V11, message_id: string) {
        return this.client.setEssenceMessage(message_id)
    }
    /**
     * 群打卡
     * @param group_id 群id
     */
    sendGroupSign(this: V11, group_id: number) {
        return this.client.pickGroup(group_id).sign()
    }

    /**
     * 移除群精华
     * @param message_id
     */
    deleteEssenceMessage(this: V11, message_id: string) {
        return this.client.removeEssenceMessage(message_id)
    }
    /**
     * 设置群名
     * @param group_id {number} 群id
     * @param name {string} 新群名
     */
    setGroupName(this: V11, group_id: number, name: string) {
        return this.client.setGroupName(group_id, name)
    }

    /**
     * 退出指定群聊
     * @param group_id {number} 群id
     */
    setGroupLeave(this: V11, group_id: number) {
        return this.client.setGroupLeave(group_id)
    }

    /**
     * 设置群成员头衔
     * @param group_id {number} 群id
     * @param user_id {number} 成员id
     * @param special_title {string} 头衔
     * @param duration {number} 持有时长 不传则永久
     */
    setGroupSpecialTitle(this: V11, group_id: number, user_id: number, special_title: string, duration: number = -1) {
        return this.client.setGroupSpecialTitle(group_id, user_id, special_title, duration)
    }

    /**
     * 处理加群请求
     * @param flag {string} 加群flag
     * @param approve {boolean} 是否同意(默认：true)
     * @param reason {string} 拒绝理由，approve为false时有效(默认为空)
     * @param block {boolean} 拒绝时是否加入黑名单，(默认：false)
     */
    setGroupAddRequest(this: V11, flag: string, approve: boolean = true, reason: string = "", block: boolean = false) {
        return this.client.setGroupAddRequest(flag, approve, reason, block)
    }

    /**
     * 获取群列表
     */
    async getGroupList(this: V11) {
        return this.client.getGroupList()
    }

    /**
     * 获取指定群信息
     * @param group_id
     */
    getGroupInfo(this: V11, group_id: number, no_cache = false) {
        return this.client.getGroupInfo(group_id, no_cache)
    }

    /**
     * 获取群成员列表
     * @param group_id
     */
    async getGroupMemberList(this: V11, group_id: number, no_cache = false) {
        return this.client.getGroupMemberList(group_id, no_cache)
    }

    /**
     * 获取指定群成员信息
     * @param group_id
     * @param user_id
     */
    getGroupMemberInfo(this: V11, group_id: number, user_id: number, no_cache = false) {
        return this.client.getGroupMemberInfo(group_id, user_id, no_cache)
    }
}
