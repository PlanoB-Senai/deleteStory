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
    console.log('Iniciando a limpeza de stories antigos...');
    
    // Listando todos os stories
    const stories = await database.listDocuments(process.env.STORIES_COLLECTION_ID);
    console.log(`Total de stories encontrados: ${stories.documents.length}`);

    if (stories.documents.length === 0) {
      console.log('Nenhum story encontrado para apagar.');
    }

    // Verificando cada story
    for (const story of stories.documents) {
      const storyCreatedAt = moment(story.$createdAt);
      const currentDate = moment();
      console.log(`Verificando story com ID: ${story.$id}, criado em: ${storyCreatedAt}`);

      if (currentDate.diff(storyCreatedAt, 'days') >= 1) {
        // Story mais antigo que 1 dia, apagando
        try {
          await storage.deleteFile(story.storyId);  // Apagando o arquivo do story
          console.log(`Arquivo do story com ID ${story.$id} apagado com sucesso.`);
          
          await database.deleteDocument(process.env.STORIES_COLLECTION_ID, story.$id);  // Apagando o documento do story
          console.log(`Story com ID ${story.$id} apagado com sucesso.`);
        } catch (deleteError) {
          console.error(`Erro ao apagar story com ID ${story.$id}:`, deleteError);
        }
      } else {
        console.log(`Story com ID ${story.$id} não foi apagado, ainda não completou 1 dia.`);
      }
    }

    res.status(200).json({ message: 'Stories antigos apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar stories antigos:', error);
    res.status(500).json({ message: 'Erro ao apagar stories antigos.' });
  }
};
