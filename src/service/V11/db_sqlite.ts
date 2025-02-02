import { MsgEntry } from "./db_entities"
import { DataSource, Repository } from "typeorm"
import { Logger } from "log4js"
import { AsyncLock } from "@/types"

export class Database {
    logger: Logger
    dbPath: string
    public dataSource: DataSource
    /**
     * 消息在数据库中的保留时间
     */
    public msgHistoryPreserveDays: number = 14 // 历史消息默认存储2周
    public msgHistoryCheckInterval: number = 1 * 24 * 3600 * 1000 // 历史记录检查间隔
    msgRepo: Repository<MsgEntry>
    dbLock: AsyncLock

    constructor(dbPath: string, logger: Logger) {
        this.dbPath = dbPath
        this.logger = logger
        this.dbLock = new AsyncLock()

        this.dataSource = new DataSource({
            type: "sqlite",
            database: dbPath,
            entities: [MsgEntry],
        })

        this.initDB()
    }

    async initDB() {
        try {
            await this.dataSource.initialize()
            await this.dataSource.synchronize(false)
        } catch (err) {
            this.logger.error(`sqlite [${this.dbPath}] open fail!`, err)
            return
        }

        this.msgRepo = this.dataSource.getRepository(MsgEntry)
        this.logger.debug(`sqlite [${this.dbPath}] open success`)

        setInterval(() => {
            this.shrinkDB()
        }, this.msgHistoryCheckInterval)
    }

    /**
     * 增加或更新一条消息到数据库
     * @param msgData
     */
    public async addOrUpdateMsg(msgData: MsgEntry): Promise<number> {
        await this.dbLock.lock()
        try {
            let msgDataExists = await this.getMsgByParams(msgData.user_id, msgData.group_id, msgData.seq)
            if (msgDataExists) {
                // send_msg() 返回值和同步的 message 消息哪个先来不确定，send_msg 返回值后来时不允许更新数据库
                if (msgData.content.length == 0) {
                    return msgDataExists.id
                }
                msgData.id = msgDataExists.id
                await this.msgRepo.update({ id: msgData.id }, msgData)
                return msgDataExists.id
            }

            msgData = await this.msgRepo.save(msgData)
            this.logger.debug(`addMsg with id:${msgData.id}`)
            return msgData.id
        } finally {
            this.dbLock.unlock()
        }
    }

    /**
     * 通过 icqq 的 base64 格式的 message_id 获取一个 MsgData 对象
     * @param base64_id
     * @returns
     */
    public async getMsgByBase64Id(base64_id: string): Promise<MsgEntry | null> {
        let ret = await this.msgRepo.findOneBy({ base64_id: base64_id })
        return ret
    }

    /**
     * 通过 number 类型的 id 自增主键获取一个 MsgData 对象
     * @param id
     * @returns
     */
    public async getMsgById(id: number): Promise<MsgEntry | null> {
        let ret = await this.msgRepo.findOneBy({ id: id })
        return ret
    }

    /**
     * 通过参数从数据库中查找消息
     * @param user_id
     * @param group_id
     * @param seq
     */
    public async getMsgByParams(user_id: string, group_id: number, seq: number): Promise<MsgEntry | null> {
        let ret = await this.msgRepo.findOneBy({ user_id: user_id, group_id: group_id, seq: seq })
        return ret
    }

    /**
     * 将一条消息标记为 recalled
     * @param base64_id
     * @param id
     */
    public async markMsgAsRecalled(base64_id?: string, id?: number) {
        if (base64_id || id)
            await this.msgRepo.update(base64_id ? { base64_id: base64_id } : { id: id }, {
                recalled: true,
                recall_time: new Date(),
            })
        else throw new Error("base64_id 或 id 参数至少一个应该被赋值")
    }

    /**
     * 根据 `msgPreserveDays` 变量定义的保留期限收缩数据库
     */
    public async shrinkDB() {
        let dt = new Date()
        dt.setDate(dt.getDate() - this.msgHistoryPreserveDays)

        await this.msgRepo.createQueryBuilder().delete().from(MsgEntry).where("create_time < :dt", { dt: dt }).execute()
    }
}
