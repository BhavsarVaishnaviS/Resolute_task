// import mongoose, { Document, Schema } from 'mongoose';

// export interface IStudent extends Document {
//   // All fields stored double-encrypted as a single JSON blob
//   encryptedData: string;
//   // Email stored separately (hashed) for lookup/uniqueness
//   emailHash: string;
//   // Email of the user who registered this student (lowercase)
//   registeredBy: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const StudentSchema: Schema = new Schema(
//   {
//     encryptedData: {
//       type: String,
//       required: true,
//     },
//     emailHash: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     registeredBy: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IStudent>('Student', StudentSchema);


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