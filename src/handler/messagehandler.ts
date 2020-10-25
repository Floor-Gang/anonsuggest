import {Message, MessageAttachment, MessageEmbed, TextChannel} from "discord.js";
import {pool} from "../db/db";
import {selectAnon} from "../commands/bot/utils";
import {CommandoClient} from "discord.js-commando";
import * as fs from "fs";

const request = require('request').defaults({encoding: null});
import concat from "concat-stream";

export default class MessageHandler {
    private readonly msg: Message;
    private client: CommandoClient;
    constructor(message: Message, client: CommandoClient) {
        this.msg = message;
        this.client = client
        this.handleSubmission().then(_ => _)
    }

    private async handleSubmission() {
        let event = await pool.query("SELECT * FROM anon_muting.events WHERE submissions_channel_id = $1", [this.msg.channel.id])
        if (event.rowCount === 0) return // Return if channel not in database


        let channel = (await this.client.channels.fetch(event.rows[0].review_channel_id, true, true)) as TextChannel;
        let embed = new MessageEmbed({
            title: 'Submission review',
            timestamp: new Date(),
            description: this.msg.content,
            author: {
                name: `${this.msg.author.username}#${this.msg.author.discriminator}`,
                iconURL: this.msg.author.displayAvatarURL(),
            },
            color: "BLURPLE",
        });

        let attachment = this.msg.attachments.first()
        let img;

        if (attachment != undefined) {
            request.get(attachment.url, function (err: any, res: any, body: Buffer) {
                img = res.body
                console.log(img)
            })
        }

        if (img != undefined) {
            console.log("Here!")
            embed.attachFiles([img])
            // embed.setImage("attachment://file.jpg")
        }

        await channel.send(embed);

        // await this.msg.delete();

        let DMChannel = await this.msg.author.createDM();
        await DMChannel.send("Thanks for submitting! Your post is currently in review and will show up shortly");

    }
}
