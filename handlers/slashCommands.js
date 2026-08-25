const { readdirSync, lstatSync } = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require(`${process.cwd()}/botconfig/config.json`);
const dirSetup = [
    {
        Folder: "Info",
        CmdName: "info",
        CmdDescription: "Get Informations!",
    },
    {
        Folder: "Music",
        CmdName: "music",
        CmdDescription: "Listen to Music!",
    },
    {
        Folder: "Admin",
        CmdName: "admin",
        CmdDescription: "Administrate the Server!",
    },
    {
        Folder: "NSFW",
        CmdName: "nsfw",
        CmdDescription: "NSFW Content, NSFW CHANNELS only!",
    },
    {
        Folder: "Fun",
        CmdName: "fun",
        CmdDescription: "Fun related Commands!",
    },
    {
        Folder: "Giveaway",
        CmdName: "giveaway",
        CmdDescription: "Manage server giveaways!",
    },
    {
        Folder: "Moderation",
        CmdName: "moderation",
        CmdDescription: "Advanced moderation tools!",
    },
    {
        Folder: "Invites",
        CmdName: "invites",
        CmdDescription: "Invite tracking & leaderboard!",
    },
    {
        Folder: "Ticket",
        CmdName: "ticket",
        CmdDescription: "Ticket management commands!",
    },
    {
        Folder: "Birthday",
        CmdName: "birthday",
        CmdDescription: "Sistema de cumpleaños del servidor!",
    },
    {
        Folder: "Welcome",
        CmdName: "welcome",
        CmdDescription: "Comandos del sistema de bienvenida!",
    },
    {
        Folder: "Config",
        CmdName: "config",
        CmdDescription: "Configurar el servidor!",
    },
    {
        Folder: "Economy",
        CmdName: "economy",
        CmdDescription: "Sistema de economía del servidor!",
    },
    {
        Folder: "Rank",
        CmdName: "rank",
        CmdDescription: "Sistema de niveles y ranking!",
    },
    {
        Folder: "Soundboard",
        CmdName: "soundboard",
        CmdDescription: "Reproducir sonidos en un canal de voz!",
    },
    {
        Folder: "Anime",
        CmdName: "anime",
        CmdDescription: "Expresiones y emociones al estilo anime!",
    },
    {
        Folder: "Playlist",
        CmdName: "playlist",
        CmdDescription: "Gestiona tus playlists personales",
    },
    {
        Folder: "Favorites",
        CmdName: "favoritos",
        CmdDescription: "Tus canciones favoritas!",
    },
];
module.exports = client => {
    try {
        // client.slashCommands.set("commandname") //Each Command Data
        // client.slashCommands("normal" + "commandname") //each Command Data
        client.allCommands = []; //raw Slash Commands Data
        readdirSync("./slashCommands/").forEach(dir => {
            if (lstatSync(`./slashCommands/${dir}`).isDirectory()) {
                const groupName = dir;
                const cmdSetup = dirSetup.find(d => d.Folder == dir);
                //If its a valid cmdsetup
                if (cmdSetup && cmdSetup.Folder) {
                    //Set the SubCommand as a Slash Builder
                    const subCommand = new SlashCommandBuilder()
                        .setName(String(cmdSetup.CmdName).replace(/\s+/g, "_").toLowerCase())
                        .setDescription(String(cmdSetup.CmdDescription));
                    //Now for each file in that subcommand, add a command!
                    const slashCommands = readdirSync(`./slashCommands/${dir}/`).filter(file => file.endsWith(".js"));
                    for (let file of slashCommands) {
                        let pull = require(`../slashCommands/${dir}/${file}`);
                        if (pull.name && pull.description) {
                            subCommand.addSubcommand(subcommand => {
                                subcommand
                                    .setName(String(pull.name).toLowerCase().substring(0, 25))
                                    .setDescription(pull.description.substring(0, 50));
                                if (pull.options && pull.options.length > 0) {
                                    for (const option of pull.options) {
                                        if (option.User && option.User.name && option.User.description) {
                                            subcommand.addUserOption(op =>
                                                op
                                                    .setName(String(option.User.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.User.description)
                                                    .setRequired(option.User.required)
                                            );
                                        } else if (option.Integer && option.Integer.name && option.Integer.description) {
                                            subcommand.addIntegerOption(op =>
                                                op
                                                    .setName(String(option.Integer.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.Integer.description)
                                                    .setRequired(option.Integer.required)
                                            );
                                        } else if (option.String && option.String.name && option.String.description) {
                                            subcommand.addStringOption(op =>
                                                op
                                                    .setName(String(option.String.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.String.description)
                                                    .setRequired(option.String.required)
                                            );
                                        } else if (option.Channel && option.Channel.name && option.Channel.description) {
                                            subcommand.addChannelOption(op =>
                                                op
                                                    .setName(String(option.Channel.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.Channel.description)
                                                    .setRequired(option.Channel.required)
                                            );
                                        } else if (option.Role && option.Role.name && option.Role.description) {
                                            subcommand.addRoleOption(op =>
                                                op
                                                    .setName(String(option.Role.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.Role.description)
                                                    .setRequired(option.Role.required)
                                            );
                                        } else if (
                                            option.StringChoices &&
                                            option.StringChoices.name &&
                                            option.StringChoices.description &&
                                            option.StringChoices.choices &&
                                            option.StringChoices.choices.length > 0
                                        ) {
                                            subcommand.addStringOption(op =>
                                                op
                                                    .setName(
                                                        String(option.StringChoices.name).replace(/\s+/g, "_").toLowerCase()
                                                    )
                                                    .setDescription(option.StringChoices.description)
                                                    .setRequired(option.StringChoices.required)
                                                    .addChoices(
                                                        ...option.StringChoices.choices.map(c => Array.isArray(c)
                                                            ? { name: String(c[0]).substring(0, 100), value: String(c[1]) }
                                                            : { name: String(c.name).substring(0, 100), value: String(c.value) }
                                                        )
                                                    )
                                            );
                                        } else if (
                                            option.IntChoices &&
                                            option.IntChoices.name &&
                                            option.IntChoices.description &&
                                            option.IntChoices.choices &&
                                            option.IntChoices.choices.length > 0
                                        ) {
                                            subcommand.addStringOption(op =>
                                                op
                                                    .setName(
                                                        String(option.IntChoices.name).replace(/\s+/g, "_").toLowerCase()
                                                    )
                                                    .setDescription(option.IntChoices.description)
                                                    .setRequired(option.IntChoices.required)
                                                    .addChoices(
                                                        ...option.IntChoices.choices.map(c => Array.isArray(c)
                                                            ? { name: String(c[0]).substring(0, 100), value: parseInt(c[1]) }
                                                            : { name: String(c.name).substring(0, 100), value: parseInt(c.value) }
                                                        )
                                                    )
                                            );
                                        } else if (
                                            option.StringAutocomplete &&
                                            option.StringAutocomplete.name &&
                                            option.StringAutocomplete.description
                                        ) {
                                            subcommand.addStringOption(op =>
                                                op
                                                    .setName(String(option.StringAutocomplete.name).replace(/\s+/g, "_").toLowerCase())
                                                    .setDescription(option.StringAutocomplete.description)
                                                    .setRequired(option.StringAutocomplete.required ?? true)
                                                    .setAutocomplete(true)
                                            );
                                        } else {
                                            console.log(
                                                `A Option is missing the Name or/and the Description of ${pull.name}`
                                            );
                                        }
                                    }
                                }
                                return subcommand;
                            });
                            client.slashCommands.set(
                                String(cmdSetup.CmdName).replace(/\s+/g, "_").toLowerCase() + pull.name,
                                pull
                            );
                        } else {
                            console.log(file, `error -> missing a help.name, or help.name is not a string.`.brightRed);
                            continue;
                        }
                    }
                    //add the subcommand to the array
                    client.allCommands.push(subCommand.toJSON());
                } else {
                    return console.log(`The Subcommand-Folder ${dir} is not in the dirSetup Configuration!`);
                }
            } else {
                let pull = require(`../slashCommands/${dir}`);
                if (pull.name && pull.description) {
                    let Command = new SlashCommandBuilder()
                        .setName(String(pull.name).toLowerCase())
                        .setDescription(pull.description);
                    if (pull.options && pull.options.length > 0) {
                        for (const option of pull.options) {
                            if (option.User && option.User.name && option.User.description) {
                                Command.addUserOption(op =>
                                    op
                                        .setName(String(option.User.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.User.description)
                                        .setRequired(option.User.required)
                                );
                            } else if (option.Integer && option.Integer.name && option.Integer.description) {
                                Command.addIntegerOption(op =>
                                    op
                                        .setName(String(option.Integer.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.Integer.description)
                                        .setRequired(option.Integer.required)
                                );
                            } else if (option.String && option.String.name && option.String.description) {
                                Command.addStringOption(op =>
                                    op
                                        .setName(String(option.String.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.String.description)
                                        .setRequired(option.String.required)
                                );
                            } else if (option.Channel && option.Channel.name && option.Channel.description) {
                                Command.addChannelOption(op =>
                                    op
                                        .setName(String(option.Channel.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.Channel.description)
                                        .setRequired(option.Channel.required)
                                );
                            } else if (option.Role && option.Role.name && option.Role.description) {
                                Command.addRoleOption(op =>
                                    op
                                        .setName(String(option.Role.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.Role.description)
                                        .setRequired(option.Role.required)
                                );
                            } else if (
                                option.StringChoices &&
                                option.StringChoices.name &&
                                option.StringChoices.description &&
                                option.StringChoices.choices &&
                                option.StringChoices.choices.length > 0
                            ) {
                                Command.addStringOption(op =>
                                    op
                                        .setName(String(option.StringChoices.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.StringChoices.description)
                                        .setRequired(option.StringChoices.required)
                                        .addChoices(
                                            ...option.StringChoices.choices.map(c => Array.isArray(c)
                                                ? { name: String(c[0]).substring(0, 100), value: String(c[1]) }
                                                : { name: String(c.name).substring(0, 100), value: String(c.value) }
                                            )
                                        )
                                );
                            } else if (
                                option.IntChoices &&
                                option.IntChoices.name &&
                                option.IntChoices.description &&
                                option.IntChoices.choices &&
                                option.IntChoices.choices.length > 0
                            ) {
                                Command.addStringOption(op =>
                                    op
                                        .setName(String(option.IntChoices.name).replace(/\s+/g, "_").toLowerCase())
                                        .setDescription(option.IntChoices.description)
                                        .setRequired(option.IntChoices.required)
                                        .addChoices(
                                            ...option.IntChoices.choices.map(c => Array.isArray(c)
                                                ? { name: String(c[0]).substring(0, 100), value: parseInt(c[1]) }
                                                : { name: String(c.name).substring(0, 100), value: parseInt(c.value) }
                                            )
                                        )
                                );
                            } else {
                                console.log(`A Option is missing the Name or/and the Description of ${pull.name}`);
                            }
                        }
                    }
                    client.allCommands.push(Command.toJSON());
                    client.slashCommands.set("normal" + pull.name, pull);
                } else {
                    console.log(file, `error -> missing a help.name, or help.name is not a string.`.brightRed);
                }
            }
        });
    } catch (e) {
        console.log(String(e.stack).bgRed);
    }
};
/**
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
