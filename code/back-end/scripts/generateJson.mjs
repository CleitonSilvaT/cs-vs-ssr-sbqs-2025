import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateUser(userId) {
  return {
    user_id: userId,
    username: `user${userId}`,
    avatar_url: `http://localhost:5500/assets/avatar.png`,
    posts: generatePosts(getRandomInt(5, 10)),
  };
}

function generatePosts(numPosts) {
  const posts = [];
  const photos = [
    "cat",
    "aesthetic",
    "coffee",
    "dog",
    "fish",
    "sheep",
    "flower",
    "experimental",
    "film",
    "street",
    "clear",
    "plant",
    "white",
  ];

  for (let postId = 1; postId <= numPosts; postId++) {
    const randomPhoto = Math.floor(Math.random() * 13);

    posts.push({
      post_id: postId,
      image_url: `http://localhost:5500/assets/${photos[randomPhoto]}.jpg`,
      caption: `Caption for post ${postId}`,
      timestamp: new Date(
        Date.now() - getRandomInt(0, 365) * 24 * 60 * 60 * 1000
      ).toISOString(),
      likes: generateLikes(getRandomInt(5, 20)),
    });
  }
  return posts;
}

function generateLikes(numLikes) {
  const likes = [];
  for (let likeId = 0; likeId < numLikes; likeId++) {
    const likerId = getRandomInt(1, 500);
    likes.push({
      user_id: likerId,
      username: `user${likerId}`,
    });
  }
  return likes;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createJson(filename, size) {
  const users = Array.from({ length: size }, (_, i) => generateUser(i + 1));

  const outputPath = path.resolve(__dirname, "..", "data", `${filename}.json`);
  fs.writeFile(outputPath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error("Erro ao salvar o JSON:", err);
      return;
    }
    console.log(`JSON gerado e salvo como ${filename}.json`);
  });
}

const dataDirPath = path.resolve(__dirname, "..", "data");
if (!fs.existsSync(dataDirPath)) {
  fs.mkdirSync(dataDirPath, { recursive: true });
  console.log(`Pasta 'data' criada em: ${dataDirPath}`);
} else {
  console.log(`Pasta 'data' já existe em: ${dataDirPath}`);
}

createJson("extra-small", 50);
createJson("small", 200);
createJson("medium", 800);
createJson("large", 1700);
createJson("extra-large", 2600);
