import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ username }).populate('departmentId').exec();
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user._id, 
      role: user.role,
      departmentId: user.departmentId?._id || user.departmentId 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.departmentId,
      },
    };
  }

  async register(username: string, pass: string, fullName: string, departmentId: string, role: string) {
    const existing = await this.userModel.findOne({ username }).exec();
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    const passwordHash = await bcrypt.hash(pass, 10);
    const created = new this.userModel({
      username,
      passwordHash,
      fullName,
      departmentId,
      role,
    });
    await created.save();
    return created;
  }

  async validateSSO(email: string, pass: string): Promise<any> {
    if (!email || !email.endsWith('@mxv.com.vn')) {
      throw new UnauthorizedException('Email không thuộc tên miền Sở MXV (@mxv.com.vn)');
    }

    // Simulated AD Password Check
    if (pass !== 'Mxv@2026') {
      throw new UnauthorizedException('Mật khẩu Active Directory không khớp');
    }

    const username = email.split('@')[0];
    
    // Check if user already exists
    let user = await this.userModel.findOne({ username }).populate('departmentId').exec();
    
    if (!user) {
      // Dynamic provisioning: Find appropriate department
      const DepartmentModel = this.userModel.db.model('Department');
      let dept = null;
      
      if (username.includes('it')) {
        dept = await DepartmentModel.findOne({ code: 'IT_CORE' }).exec();
      } else if (username.includes('ops') || username.includes('re')) {
        dept = await DepartmentModel.findOne({ code: 'RE_OPS' }).exec();
      } else if (username.includes('surv') || username.includes('gs')) {
        dept = await DepartmentModel.findOne({ code: 'MARKET_SURV' }).exec();
      }
      
      // Fallback to first department
      if (!dept) {
        dept = await DepartmentModel.findOne().exec();
      }

      const dummyHash = await bcrypt.hash('dummy_sso_pass_2026', 10);
      const isInitialAdmin = username === 'admin_sso';
      
      const newUser = new this.userModel({
        username,
        passwordHash: dummyHash,
        fullName: `${username.charAt(0).toUpperCase() + username.slice(1)} (SSO)`,
        departmentId: dept ? dept._id : null,
        role: isInitialAdmin ? 'ADMIN' : 'STAFF',
      });
      
      const saved = await newUser.save();
      user = await this.userModel.findById(saved._id).populate('departmentId').exec();
    }
    
    return user;
  }
}
