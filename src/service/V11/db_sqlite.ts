import {readFileSync, writeFileSync, existsSync} from "fs";
import { MsgData } from "./db_entities"
import { DataSource, Repository } from "typeorm";
import { Logger } from "log4js";

export class Database {
    logger: Logger
    public dataSource: DataSource
    /**
     * 消息在数据库中的保留时间
     */
    public msgPreserveDays: number = 365 * 2
    msgRepo: Repository<MsgData>

    constructor(dbPath: string, logger: Logger){
        this.logger = logger
        this.dataSource = new DataSource({
            type: "better-sqlite3",
            database: dbPath,
            entities: [MsgData]
        })

        this.dataSource.initialize().then(()=>{
            this.msgRepo = this.dataSource.getRepository(MsgData)
            logger.debug(`sqlite [${dbPath}] open success`)
        })
        .catch((err)=> {
            logger.error(`sqlite [${dbPath}] open fail!`, err)
        })
    }

    /**
     * 增加一条消息到数据库
     * @param msgData 
     */
    public async addMsg(msgData: MsgData) {
        let ret = await this.msgRepo.insert(msgData)
        this.logger.info(`addMsg ret:${ret}`)
    }

    /**
     * 通过 icqq 的 base64 格式的 message_id 获取一个 MsgData 对象
     * @param base64_id 
     * @returns 
     */
    public async getMsgByBase64Id(base64_id: string): Promise<MsgData | null> {
        let ret = await this.msgRepo.findOneBy({base64_id: base64_id})
        return ret
    }

    /**
     * 通过 number 类型的 id 自增主键获取一个 MsgData 对象
     * @param id 
     * @returns 
     */
    public async getMsgById(id: number): Promise<MsgData | null> {
        let ret = await this.msgRepo.findOneBy({id: id})
        return ret
    }

    /**
     * 将一条消息标记为 recalled
     * @param base64_id 
     * @param id 
     */
    public async markMsgAsRecalled(base64_id?: string, id?: number) {
        if(base64_id || id)
            await this.msgRepo.update(base64_id ? {base64_id: base64_id} : {id: id}, {recalled: true, recall_time: new Date()})
        else
            throw new Error("base64_id 或 id 参数至少一个应该被赋值")
    }

    /**
     * 根据 `msgPreserveDays` 变量定义的保留期限收缩数据库
     */
    public async shrinkDB() {
        let dt = new Date()
        dt.setDate(dt.getDate() - this.msgPreserveDays)

        await this.msgRepo
        .createQueryBuilder()
        .delete()
        .from(MsgData)
        .where("create_time < :dt", {dt: dt})
        .execute()
    }
}