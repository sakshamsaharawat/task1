import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


@Schema()
export class User {
    @Prop({ type: String, required: true })
    id: string;

    @Prop({ type: String, required: true, unique: true })
    email: string;

    @Prop({ type: String })
    firstName: string;

    @Prop({ type: String })
    lastName: string;

    @Prop({ type: String })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
