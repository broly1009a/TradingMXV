import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Department } from './department.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true, enum: ['ADMIN', 'LEADER', 'STAFF'], default: 'STAFF' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual('id').get(function (this: User) {
  return this._id.toHexString();
});
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).passwordHash;
    return ret;
  },
});
UserSchema.set('toObject', { virtuals: true });
