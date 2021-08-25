const { POINT_CONVERSION_COMPRESSED } = require("constants");
const https = require("https");

// Bot configs read in from environment
const room_id = process.env.HUBOT_GROUPME_ROOM_ID;
const bot_id = process.env.HUBOT_GROUPME_BOT_ID;
const token = process.env.HUBOT_GROUPME_TOKEN;
var legitCount = process.env.HUBOT_LEGIT_COUNTER;

if (!room_id || !bot_id || !token) {
  console.error(
    `@all ERROR: Unable to read full environment.
    Did you configure environment variables correctly?
    - HUBOT_GROUPME_ROOM_ID
    - HUBOT_GROUPME_BOT_ID
    - HUBOT_GROUPME_TOKEN`
  );
  process.exit(1);
}

class AllBot {
  constructor(robot) {
    this.robot = robot;
    this.blacklist = [];
    this.leaders = [];

    // Load the blacklist as soon as we can
    this.robot.brain.once("loaded", this.loadList.bind(this));
  }

  saveList(list) {
    if(list == 'blacklist') {
      console.log("Saving blacklist");
      this.robot.brain.set("blacklist", this.blacklist);
      this.robot.brain.save();
    }

    if(list == 'leaders');
      console.log('Saving leaderlist');
      this.robot.brain.set('leaders', this.leaders);
      this.robot.brain.save();
  }

  loadList() {
    this.blacklist = this.robot.brain.get("blacklist");
    if (this.blacklist) console.log("Blacklist loaded successfully.");
    else console.warn("Failed to load blacklist.");

    this.leaders = this.robot.brain.get('leaders');
    if(this.leaders) console.log('Leaders loaded successfully');
    else console.warn('Failed to load leader list.');
  }

  addToList(item, list) {
    if(list == 'blacklist') {
      this.blacklist.push(item);
      this.saveList('blacklist');
    }
    if(list == 'leaders') {
      this.leaders.push(item);
      this.saveList('leaders');
    }
  }

  removeFromBlacklist(item) {
    let index = this.blacklist.indexOf(item);
    if (index !== -1) {
      this.blacklist.splice(index, 1);
      this.saveList('blacklist');
      console.log(`Successfully removed ${item} from blacklist.`);
    } else {
      console.warn(`Unable to find ${item} in blacklist!`);
    }
  }

  getUserByName(_name) {
    let name = _name.trim();
    if (name[0] == "@") {
      name = name.slice(1);
    }
    let user = this.robot.brain.userForName(name);
    if (!user.user_id) return null;
    else return user;
  }

  getUserById(id) {
    let user = this.robot.brain.userForId(id);
    if (!user.user_id) return null;
    else return user;
  }

  respondToID(res, target) {
    // Get ID command
    console.log(`Looking for user ID by name: ${target}`);
    const found = this.getUserByName(target);

    if (found) {
      const id = found.user_id;
      console.log(`Found ID ${id} by name ${target}`);
      res.send(`${target}: ${id}`);
    } else {
      res.send(`Could not find a user with the name ${target}`);
    }
  }

  respondToName(res, target) {
    console.log(`Looking for user name by ID: ${target}`);
    const found = this.getUserById(target);

    if (found) {
      const name = found.name;
      console.log(`Found name ${name} by ID ${target}`);
      res.send(`${target}: ${name}`);
    } else {
      res.send(`Could not find a user with the ID ${target}`);
    }
  }

  coinFlip(res) {
    console.log(`Flip a coin requested.`);
    var coin = ['Heads','Tails'];
    return res.send(res.random(coin));      
  }

  legitCounter(res, check) {
    var request = JSON.parse(this.req.chunks[0]);
    console.log(request);
    if(check) {
      console.log('Checking Counter Amount');
      return res.send(`Shit man, legit count at ${process.env.HUBOT_LEGIT_COUNTER}`);
    }
    
    if(request.user_id == '86736722') {
      process.env.HUBOT_LEGIT_COUNTER++;
      return console.log('LEGIT COUNT + 1 | Current count = ' + process.env.HUBOT_LEGIT_COUNTER);
    }


  }

  listCommands(res) {
    console.log(res);
    var output = '';
    const commands = {
      "coinflip" : [
        {
          "category" : "Gambling",
          "command" : "coinflip",
          "alias" : ["cf", "cflip", "coinf"],
          "description" : "Flips a coin and returns heads or tails."
        }
      ],
      "all" : [
        {
          "category" : "Useful",
          "command" : "all",
          "alias" : ["all"],
          "description" : "Mentions everyone in the team."
        }
      ]
    };
    
    for(var x = 0; x <= commands.length; x++) {
      output += commands[x] + ', ' + commands[x].description + '\n';
    }

    return res.send(output);

  }


  respondToViewBlacklist(res) {
    // Raw blacklist
    if (res.match[1]) return res.send(JSON.stringify(this.blacklist));

    const blacklistNames = this.blacklist.map(
      user => this.getUserById(user).name
    );

    if (blacklistNames.length > 0) return res.send(blacklistNames.join(", "));
    else return res.send("There are currently no users blacklisted.");
  }

  respondToBlacklist(res, target) {
    const user = this.getUserByName(target);

    if (!user) return res.send(`Could not find a user with the name ${target}`);

    console.log(`Blacklisting ${target}, ${user.user_id}`);
    this.addToList(user.user_id, 'blacklist');
    res.send(`Blacklisted ${target} successfully.`);
  }

  respondToWhitelist(res, target) {
    const user = this.getUserByName(target);

    if (!user) return res.send(`Could not find a user with the name ${target}`);

    console.log(`Whitelisting ${target}, ${user.user_id}`);
    this.removeFromBlacklist(user.user_id);
    res.send(`Whitelisted ${target} successfully`);
  }
  
  
  respondToLameBoy(res, target) {
   const user = this.getUserByName(target); 
    return res.send(`Oh shit is that you ${target}`);
  }
  
  messageLeaders(res) {
    const text =
      res.match[0].length > res.match[1].length ? res.match[0] : res.match[1];
    
    const message = {
      text,
      bot_id,
      attachments: [{ loci: [], type: "mentions", user_ids: [] }]
    };

    const users = this.robot.brain.users();
    Object.keys(users).map((userID, index) => {

    })

  }

  respondToAtAll(res) {
    // Select the longer of the two options.
    // TODO: Maybe combine them?
    const text =
      res.match[0].length > res.match[1].length ? res.match[0] : res.match[1];

    // Default text if not long enough
    // TODO: Is this necessary? Can't we tag everyone on a 1 character message?
    // if (text.length < users.length)
    //   text = "Please check the GroupMe, everyone.";

    // The message for use in GroupMe API
    const message = {
      text,
      bot_id,
      attachments: [{ loci: [], type: "mentions", user_ids: [] }]
    };

    // Add "mention" for each user
    const users = this.robot.brain.users();
    Object.keys(users).map((userID, index) => {
      // Skip blacklisted users
      if (this.blacklist.indexOf(userID) !== -1) return;

      // TODO: Would [i, i] work?
      message.attachments[0].loci.push([index, index + 1]);
      message.attachments[0].user_ids.push(userID);
    });

    // Send the request
    const json = JSON.stringify(message);
    const groupmeAPIOptions = {
      agent: false,
      host: "api.groupme.com",
      path: "/v3/bots/post",
      port: 443,
      method: "POST",
      headers: {
        "Content-Length": json.length,
        "Content-Type": "application/json",
        "X-Access-Token": token
      }
    };
    const req = https.request(groupmeAPIOptions, response => {
      let data = "";
      response.on("data", chunk => (data += chunk));
      response.on("end", () =>
        console.log(`[GROUPME RESPONSE] ${response.statusCode} ${data}`)
      );
    });
    req.end(json);
  }

  // Defines the main logic of the bot
  run() {
    // Register listeners with hubot
    this.robot.hear(/get id (.+)/i, res => this.respondToID(res, res.match[1]));
    this.robot.hear(/get name (.+)/i, res =>
      this.respondToName(res, res.match[1])
    );
    this.robot.hear(/view( raw)* blacklist/i, res =>
      this.respondToViewBlacklist(res)
    );
    this.robot.hear(/blacklist (.+)/i, res =>
      this.respondToBlacklist(res, res.match[1])
    );
    this.robot.hear(/whitelist (.+)/i, res =>
      this.respondToWhitelist(res, res.match[1])
    );
    
    this.robot.hear(/is that (.*)/i, res=>
      this.respondToLameBoy(res, res.match[1])
    );

    this.robot.hear(/coinflip/i, res =>
      this.coinFlip(res)
    );

    this.robot.hear(/commands/i, res=>
      this.listCommands(res)
    );

    this.robot.hear(/legit/i, res=>
      this.legitCounter(res)
    );

    this.robot.hear(/^counter$/i, res=>
      this.legitCounter(res, true)
    );


    // Mention @all command
    this.robot.hear(/(.*)@all(.*)/i, res => this.respondToAtAll(res));
  }
}

module.exports = robot => {
  const bot = new AllBot(robot);
  bot.run();
};
