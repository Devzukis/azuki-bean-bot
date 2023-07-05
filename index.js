///// Import Node Modules /////
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { ethers } = require("ethers");
const { EUploadMimeType, TwitterApi } = require("twitter-api-v2");
const chalk = require("chalk");

///// Discord Token
const discordToken = process.env.discordToken;

///// Twitter API Credentials/////
const tClient = new TwitterApi({
	appKey: process.env.twitAppKey,
	appSecret: process.env.twitAppSecret,
	accessToken: process.env.twitAccessToken,
	accessSecret: process.env.twitAccessSecret,
});

const twitterClient = tClient.readWrite;

///// Websocket Provider /////
const wssEndpoint = `wss://eth-mainnet.g.alchemy.com/v2/${process.env.alchemyKey}`;

///// Alchemy Provider /////
const alchemyProvider = new ethers.providers.AlchemyProvider(
	"homestead",
	process.env.alchemyProvider
);

///// Contract Params /////
const contractAddress = "0xb6a37b5d14d502c3ab0ae6f3a0e058bc9517786e";
const contractAbi = [
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "from", type: "address" },
			{ indexed: true, internalType: "address", name: "to", type: "address" },
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
		],
		name: "Transfer",
		type: "event",
	},
];

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log(`Logged in as ${chalk.yellow(client.user.tag)}!`);
});

// Login to Discord with your client's token
client.login(discordToken);

// WSS using init pattern
let wssProvider;
let wssContract;

// Ping-Pong Heartbeat
let pingReturned = false;
let aliveInterval = 150000;
let timeoutInterval = 30000;

let blocksCounted = 0;

const retrieveTraits = async (tokenId, owner, ownerAddy) => {
	const metaUrl = `https://elementals-metadata.azuki.com/elemental/${tokenId}`;

	console.log(chalk.red(`Retrieving metadata for token #${tokenId}\n${metaUrl}`))
	try {
		const traits = await fetch(metaUrl, { method: "GET" });
		//console.log(traits)
		if (traits.ok) {
			console.log(chalk.green("Metadata Verified!"))
			let jsonTraits = await traits.json();
			console.log(jsonTraits);
			const embed = new EmbedBuilder()
				.setColor(0xb91935)
				.setTitle(`Elemental #${tokenId} has been revealed!`)
				.setURL(
					`https://opensea.io/assets/ethereum/0xb6a37b5d14d502c3ab0ae6f3a0e058bc9517786e/${tokenId}`
				)
				.addFields({
					name: `Owner:`,
					value: `${owner}`,
					inline: false,
				});
			for (let i = 0; i < jsonTraits.attributes.length; i++) {
				embed.addFields({
					name: `${jsonTraits.attributes[i].trait_type}`,
					value: `${jsonTraits.attributes[i].value}`,
					inline: true,
				});
			}
			embed
				.setImage(`${jsonTraits.image}`)
				.setTimestamp()
				.setFooter({ text: "Azuki Elemental Beans Bot by 0xSharp" });

		await	client.channels.cache
				.get(process.env.channelId)
				.send({ embeds: [embed] });
			console.log(chalk.green("Discord Message Sent Successfully."));
			const tweet = async (imgUrl, tokenId, owner) => {
				try {
					let img = await fetch(imgUrl);
					let file = await img.blob();
					let arrayBuffer = await file.arrayBuffer();
					let buffer = Buffer.from(arrayBuffer);
					//console.log(buffer);
					const tUpload = await twitterClient.v1.uploadMedia(
						Buffer.from(buffer),
						{ mimeType: EUploadMimeType.Png }
					);
					try {
						await twitterClient.v2.tweet(
							`Elemental #${tokenId} has been revealed!\nOwner: ${owner}\nCollector Profile: https://www.azuki.com/collector/${ownerAddy}`,
							{
								media: { media_ids: [tUpload] },
							}
						);
						console.log(chalk.green("Tweeted Successfully."));
						img = undefined;
						file = undefined;
						arrayBuffer = undefined;
						buffer = undefined;
					} catch (error) {
						console.log(error);
					}
				} catch (error) {
					console.log(error);
				}
			};
			let imgUrl = jsonTraits.image;
				await tweet(imgUrl, tokenId, owner);
			return;
		} else {
			console.log("Something wrong with metadata...")
		}
	} catch (error) {
		console.log(error);
	}
};

const wssInit = async () => {
	// Initialize the wssProvider
	wssProvider = new ethers.providers.WebSocketProvider(wssEndpoint);

	// Initialize a Contract
	wssContract = new ethers.Contract(contractAddress, contractAbi, wssProvider);

	// Initialize Filters
	const _transferFilter = wssContract.filters.Transfer();

	// On websocket open, send a message
	wssProvider._websocket.on("open", () => {
		console.log("WSS: Open!");
	});

	// On a new block
	wssProvider.on("block", (blockNumber_) => {
		blocksCounted += 1;
		if (blocksCounted === 100) {
			console.log(`New Block: ${blockNumber_}`);
		}
	});

	// While receiving a pong, log the pong to the console.
	wssProvider._websocket.on("pong", () => {
		console.log("Pong!");

		// On a pong, we set the pingReturned as true
		pingReturned = true;
	});

	// While the websocket closes, do actions.
	wssProvider._websocket.on("close", async (closeCode_) => {
		console.log(`WSS: Close! >> Code: ${closeCode_}`);

		// Refresh the ping-pong to heartbeat on every close
		console.log(`Attempting to revive the WSS`);
		await wssInit();
		console.log(`Successfully revived the WSS`);
	});

	// Ping-Pong Heartbeat Revival System
	/** Every 15 seconds, create a 10-second timeout. If it reaches, terminate the WSS */
	setInterval(async () => {
		console.log("WSS: Heartbeat Check Running...");

		// First, we send a ping and mark the ping as awaiting pong
		pingReturned = false;
		wssProvider._websocket.ping();

		// We wait for timeoutInterval time and then run a check-if-action scheme
		setTimeout(async () => {
			if (pingReturned == false) {
				console.log("WSS: Timeout Reached! Terminating WSS!");
				wssProvider._websocket.terminate();
			} else {
				console.log("WSS: Pong recieved! Socket is alive!");
			}
		}, timeoutInterval);
	}, aliveInterval);

	// Contract Actions
	wssContract.on(_transferFilter, async (from_, to_, tokenId_, eventData_) => {
		const ownerEns = await alchemyProvider.lookupAddress(to_);
		let owner;
		if (ownerEns != null) {
			owner = ownerEns
		} else {
			owner = `${to_.slice(0, 5)}...${to_.substr(to_.length - 5)}`
		}

		console.log(
			chalk.red(`TX Detected:\nFrom:${from_}\nTo:${owner}\nToken ID: ${tokenId_}\nTX Hash: ${eventData_.transactionHash}`)
		);
		console.log(eventData_.transactionHash);
		if (from_ === "0x0000000000000000000000000000000000000000") {
			let numTokenId = ethers.BigNumber.from(tokenId_).toNumber();
			console.log(chalk.blue("Mint Detected.\nWaiting 2 minutes for metadata to populate..."));
			const getTraits = async () => {
				await new Promise((res) => setTimeout(res, 120000));
				console.log(
					chalk.yellow(`Retrieving data for Token #${numTokenId}...`)
				);
				await retrieveTraits(numTokenId, owner, to_);
			};
			await getTraits();
		} else {
			console.log("Not a mint.");
		}
	});
};

const startWss = async () => await wssInit();

startWss();
