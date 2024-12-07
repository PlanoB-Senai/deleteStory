const sdk = require('node-appwrite');
const moment = require('moment');

// Criação do cliente do Appwrite
const client = new sdk.Client();

// Configuração do cliente
client
  .setEndpoint(process.env.ENDPOINT) // Substitua com seu endpoint
  .setProject(process.env.PROJECT_ID) // Substitua com seu ID do projeto
  .setKey(process.env.API_KEY); // Substitua com sua chave de API

// Acessando diretamente os serviços sem o 'new'
const database = client.database;
const storage = client.storage;

module.exports = async (req, res) => {
  console.log("teste");
  try {
    // Listar documentos da coleção 'stories'
    const response = await database.listDocuments(process.env.STORIES_COLLECTION_ID);

    for (const story of response.documents) {
      const storyCreatedAt = moment(story.$createdAt);
      const currentDate = moment();

      // Verificar se o story tem mais de 1 dia
      if (currentDate.diff(storyCreatedAt, 'days') >= 1) {
        // Apagar o arquivo no storage
        await storage.deleteFile(story.storyId);
        // Apagar o documento da coleção
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
