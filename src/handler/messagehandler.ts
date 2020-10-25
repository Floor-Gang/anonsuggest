import {FileOptions, Message, MessageEmbed, TextChannel} from "discord.js";
import {pool} from "../db/db";
import {checkIfUserMuted} from "../commands/bot/utils";
import {CommandoClient} from "discord.js-commando";

const request = require('request').defaults({encoding: null});

export default class MessageHandler {
    private readonly msg: Message;
    private client: CommandoClient;
    constructor(message: Message, client: CommandoClient) {
        this.msg = message;
        this.client = client
        this.handleSubmission().then(_ => _)
    }

    private async handleSubmission() {
        let event = await pool.query("SELECT * FROM anon_muting.events WHERE submissions_channel_id = $1 AND active = true", [this.msg.channel.id])
        if (event.rowCount === 0) return // Return if channel not in database

        let DMChannel = await this.msg.author.createDM();

        if (await checkIfUserMuted(this.msg.author.id)) {
            return await this.msg.delete();
        }

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
            img = await new Promise((resolve, reject) => {
                // @ts-ignore
                request.get(attachment.url, async function (err: any, res: any, body: Buffer) {
                    if (body != undefined) {
                        resolve(body)
                    }
                })
            });
        }

        if (img != undefined) {
            embed.attachFiles([(img) as FileOptions])
            embed.setImage("attachment://file.jpg")
        }

        let review_msg = await channel.send(embed);

        await this.msg.delete();

        await DMChannel.send("Thanks for submitting! Your post is currently in review and will show up shortly");

        await review_msg.react('👍')
        await review_msg.react('👎')

        await pool.query("INSERT INTO anon_muting.submissions \
            (user_id, review_message_id, event_id) VALUES \
            ($1, $2, $3)", [this.msg.author.id, review_msg.id, event.rows[0].event_id])
    }
}
