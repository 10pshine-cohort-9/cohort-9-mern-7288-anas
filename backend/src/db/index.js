import logger from '../utils/logger.js';
import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(connectionInstance);
        logger.info(`\nMongoDB Connected | DB host : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        logger.error(error, "MongoDB connection error"); 
        process.exit(1)
    }
}

export default connectDB