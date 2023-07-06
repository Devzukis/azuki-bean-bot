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
	process.env.alchemyKey
);

///// Contract Params /////
const contractAddress = "0xb6a37b5d14d502c3ab0ae6f3a0e058bc9517786e";
const contractAbi = [
	{
		inputs: [
			{ internalType: "string", name: "_name", type: "string" },
			{ internalType: "string", name: "_symbol", type: "string" },
			{ internalType: "uint16", name: "maxSupply_", type: "uint16" },
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{ inputs: [], name: "AlreadyMinted", type: "error" },
	{ inputs: [], name: "BeanAddressNotSet", type: "error" },
	{ inputs: [], name: "InvalidRecipient", type: "error" },
	{ inputs: [], name: "InvalidRedeemer", type: "error" },
	{ inputs: [], name: "InvalidTokenId", type: "error" },
	{ inputs: [], name: "NoMoreTokenIds", type: "error" },
	{ inputs: [], name: "NotAllowedByRegistry", type: "error" },
	{ inputs: [], name: "NotMinted", type: "error" },
	{ inputs: [], name: "RedeemBeanNotOpen", type: "error" },
	{ inputs: [], name: "RegistryNotSet", type: "error" },
	{ inputs: [], name: "Unauthorized", type: "error" },
	{ inputs: [], name: "UnsafeRecipient", type: "error" },
	{ inputs: [], name: "WrongFrom", type: "error" },
	{ inputs: [], name: "ZeroAddress", type: "error" },
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "spender",
				type: "address",
			},
			{ indexed: true, internalType: "uint256", name: "id", type: "uint256" },
		],
		name: "Approval",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{ indexed: false, internalType: "bool", name: "approved", type: "bool" },
		],
		name: "ApprovalForAll",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "to", type: "address" },
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "beanId",
				type: "uint256",
			},
		],
		name: "BeanRedeemed",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "from", type: "address" },
			{ indexed: true, internalType: "address", name: "to", type: "address" },
			{ indexed: true, internalType: "uint256", name: "id", type: "uint256" },
		],
		name: "Transfer",
		type: "event",
	},
	{
		inputs: [],
		name: "MAX_SUPPLY",
		outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "operator", type: "address" },
			{ internalType: "uint256", name: "tokenId", type: "uint256" },
		],
		name: "approve",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "owner", type: "address" }],
		name: "balanceOf",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		name: "getApproved",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "", type: "address" },
			{ internalType: "address", name: "", type: "address" },
		],
		name: "isApprovedForAll",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "isRegistryActive",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "name",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "operatorFilteringEnabled",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
		name: "ownerOf",
		outputs: [{ internalType: "address", name: "owner", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "realOwner",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256[]", name: "beanIds", type: "uint256[]" },
		],
		name: "redeemBeans",
		outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "redeemInfo",
		outputs: [
			{ internalType: "bool", name: "redeemBeanOpen", type: "bool" },
			{ internalType: "address", name: "beanAddress", type: "address" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "registryAddress",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "renounceOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "tokenId", type: "uint256" },
			{ internalType: "uint256", name: "salePrice", type: "uint256" },
		],
		name: "royaltyInfo",
		outputs: [
			{ internalType: "address", name: "", type: "address" },
			{ internalType: "uint256", name: "", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "from", type: "address" },
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256", name: "id", type: "uint256" },
		],
		name: "safeTransferFrom",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "from", type: "address" },
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256", name: "id", type: "uint256" },
			{ internalType: "bytes", name: "data", type: "bytes" },
		],
		name: "safeTransferFrom",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "operator", type: "address" },
			{ internalType: "bool", name: "approved", type: "bool" },
		],
		name: "setApprovalForAll",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "string", name: "baseURI", type: "string" }],
		name: "setBaseURI",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "string", name: "baseURIPermanent", type: "string" },
		],
		name: "setBaseURIPermanent",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "contractAddress", type: "address" },
		],
		name: "setBeanAddress",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "receiver", type: "address" },
			{ internalType: "uint96", name: "feeNumerator", type: "uint96" },
		],
		name: "setDefaultRoyalty",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "bool", name: "_isRegistryActive", type: "bool" }],
		name: "setIsRegistryActive",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
		],
		name: "setIsUriPermanent",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "string", name: "_newName", type: "string" },
			{ internalType: "string", name: "_newSymbol", type: "string" },
		],
		name: "setNameAndSymbol",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "bool", name: "value", type: "bool" }],
		name: "setOperatorFilteringEnabled",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "bool", name: "_redeemBeanOpen", type: "bool" }],
		name: "setRedeemBeanState",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_registryAddress", type: "address" },
		],
		name: "setRegistryAddress",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "tokenId", type: "uint256" },
			{ internalType: "address", name: "receiver", type: "address" },
			{ internalType: "uint96", name: "feeNumerator", type: "uint96" },
		],
		name: "setTokenRoyalty",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
		name: "supportsInterface",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "symbol",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
		name: "tokenURI",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalSupply",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "from", type: "address" },
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256", name: "id", type: "uint256" },
		],
		name: "transferFrom",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
		name: "transferLowerOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "newRealOwner", type: "address" },
		],
		name: "transferRealOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
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

// Initializing Vars
let pendingBeans = {};

const retrieveTraits = async (tokenId, owner, ownerAddy, redeemedBeanTier) => {
	const metaUrl = `https://elementals-metadata.azuki.com/elemental/${tokenId}`;

	console.log(
		chalk.red(`Retrieving metadata for token #${tokenId}\n${metaUrl}`)
	);
	try {
		const traits = await fetch(metaUrl, { method: "GET" });
		//console.log(traits)
		if (traits.ok) {
			console.log(chalk.green("Metadata Verified!"));
			let jsonTraits = await traits.json();
			let domain = jsonTraits.attributes[0].value;
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
				})
				.addFields({
					name: "Bean Tier:",
					value: redeemedBeanTier,
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

			await client.channels.cache
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
							`${domain} Elemental #${tokenId} has been revealed!\nBean Tier: ${redeemedBeanTier}\nOwner: ${owner}\nCollector Profile: https://www.azuki.com/collector/${ownerAddy}`,
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
			console.log(traits)
			console.log("Something wrong with metadata...");
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
	wssContract.on("BeanRedeemed", async (to_, elementalId_, beanId_, eventData_) => {
		const ownerEns = await alchemyProvider.lookupAddress(to_);
		let owner;
		if (ownerEns != null) {
			owner = ownerEns;
		} else {
			owner = `${to_.slice(0, 5)}...${to_.substr(to_.length - 5)}`;
		}

		console.log(
			chalk.yellow(
				`TX Detected:\nowner:${owner}\nElemental ID: ${elementalId_}\nBurned Bean ID: ${beanId_}\nTX Hash: ${eventData_.transactionHash}`
			)
		);

				const beanMetaURL = `https://elementals-metadata.azuki.com/mystery-bean/${beanId_}`;
				const redeemedBeanMeta = await fetch(beanMetaURL, { method: "GET" });
				if (redeemedBeanMeta.ok) {
					let jsonTraits = await redeemedBeanMeta.json();
					let redeemedBeanTier = jsonTraits.attributes[0].value;
					console.log(
						chalk.blue(
							"Mint Detected.\nWaiting 2 minutes for metadata to populate..."
						)
					);
					console.log(eventData_);
					const getTraits = async () => {
						await new Promise((res) => setTimeout(res, 120000));
						console.log(
							chalk.yellow(`Retrieving data for Token #${elementalId_}...`)
						);
						await retrieveTraits(elementalId_, owner, to_, redeemedBeanTier);
					};
					await getTraits();
				}
	});
};

const startWss = async () => await wssInit();

startWss();
