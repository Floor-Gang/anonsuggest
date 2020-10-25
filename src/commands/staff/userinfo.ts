import { CommandoClient, Command, CommandoMessage } from "discord.js-commando";
import * as utils from "../bot/utils";
import {checkIfUserMuted, getChannel, getMember} from "../bot/utils";
import {pool} from "../../db/db";

export = class UserInfo extends Command {
    constructor(bot: CommandoClient) {
        super(bot, {
            name: 'userinfo',
            aliases: ['ui', 'about'],
            group: 'staff',
            memberName: 'userinfo',
            userPermissions: ['MANAGE_ROLES'],
            description: 'Get information about user',
            args: [
                {
                    key: 'userID',
                    prompt: 'The user you want to display',
                    type: 'string'
                },
            ],
            argsPromptLimit: 0,
            argsType:'multiple',
            guildOnly: true,
        });
    }

    async run(msg: CommandoMessage, {userID}: {userID: string}) {
        let user = await getMember(userID, msg.guild);

        if (user == undefined) {
            return await msg.reply("Unable to locate that user.")
        }

        return await msg.say("This command is under construction");
    }

    // Function that executes if something blocked the exuction of the run function.
    // e.g. Insufficient permissions, throttling, nsfw, ...
    async onBlock(msg: CommandoMessage) {
        // Member that wanted to unmute didn't have enough perms to do it. Report
        // it back and delete message after a second.
        return (await msg.channel.send("Insufficient permissions to run this command."));/*.delete({timeout:utils.MILIS});/*/



    }
}
