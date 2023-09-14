import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity()
export class MsgEntry {
    @PrimaryGeneratedColumn()
    id?: number
    
    @Column()
    base64_id: string   // message_id from icqq

    @Column()
    seq: number         // 群聊每个群序号独立，因此不能用来做全局唯一id
    
    @Column()
    sender: number

    @Column()
    nickname: string
    
    @Column()
    group_id: number    // for private msg it's 0

    @Column()
    group_name: string
    
    @Column({length: 1024})
    content: string
    
    @Column({default:false})
    recalled: boolean
    
    @CreateDateColumn()
    create_time: Date
    
    @Column({nullable:true})
    recall_time?: Date
}
