import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  encryptedFields: Record<string, string>;
  emailHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    encryptedFields: {
      type: Map,
      of: String,
      required: true,
    },
    emailHash: {
      type: String,
      required: true,
      unique: true,   
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', StudentSchema);