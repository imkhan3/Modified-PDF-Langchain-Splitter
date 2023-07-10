import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new CustomPDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 930,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(rawDocs);

    // Indexing Variables
    var i = 1; 
    var previousFile = null;

    for(const key in docs){
        // Sanitize the data
        // Replace double quotes with single quotes
        docs[key].pageContent = docs[key].pageContent.replace(/"/g, "'");
        // Remove multiple spaces with single space
        docs[key].pageContent = docs[key].pageContent.replace(/\s\s+/g, ' ');
        // Remove new lines
        docs[key].pageContent = docs[key].pageContent.replace(/(\r\n|\n|\r)/gm, "");
        // Replace ’’ with '
        docs[key].pageContent = docs[key].pageContent.replace(/’’/g, "'");
        // Replace ‘‘ with '
        docs[key].pageContent = docs[key].pageContent.replace(/‘‘/g, "'");
        // Replace ‘ with '
        docs[key].pageContent = docs[key].pageContent.replace(/‘/g, "'");
        // Replace ’ with '
        docs[key].pageContent = docs[key].pageContent.replace(/’/g, "'");
        // Replace numbers that are in between letters with nothing
        docs[key].pageContent = docs[key].pageContent.replace(/[a-zA-Z]\d+[a-zA-Z]/g, "");
        // Replace numbers that are connected to words with nothing
        docs[key].pageContent = docs[key].pageContent.replace(/\d+[a-zA-Z]/g, "");

        // File name
        var fileName = docs[key].metadata.source.replace(/^.*[\\\/]/,'').replace(/\.pdf$/, '');

        // Indexing file name
        if(fileName != previousFile){
            i = 1;
        }
        previousFile = fileName;
       
        console.log(`"${fileName} ${i}": "Document: '${fileName}' - ${docs[key].pageContent}",`);
        i++;
    }


    // console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the PDF documents
    // await PineconeStore.fromDocuments(docs, embeddings, {
    //   pineconeIndex: index,
    //   namespace: PINECONE_NAME_SPACE,
    //   textKey: 'text',
    // });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
