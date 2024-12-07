const sdk = require('node-appwrite');
const moment = require('moment');

const client = new sdk.Client();
const database = new sdk.Database(client);
const storage = new sdk.Storage(client);

client
  .setEndpoint(process.env.ENDPOINT) // Substitua com seu endpoint
  .setProject(process.env.PROJECT_ID) // Substitua com seu ID do projeto
  .setKey(process.env.API_KEY); // Substitua com sua chave de API

module.exports = async (req, res) => {
  try {
    const stories = await database.listDocuments(process.env.STORIES_COLLECTION_ID);

    for (const story of stories.documents) {
      const storyCreatedAt = moment(story.$createdAt);
      const currentDate = moment();

      if (currentDate.diff(storyCreatedAt, 'days') >= 1) {
        await storage.deleteFile(story.storyId);
        await database.deleteDocument(process.env.STORIES_COLLECTION_ID, story.$id);

        console.log(`Story com ID ${story.$id} apagado com sucesso.`);
      }
    }

    res.status(200).json({ message: 'Stories antigos apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar stories antigos:', error);
    res.status(500).json({ message: 'Erro ao apagar stories antigos.' });
  }
};
