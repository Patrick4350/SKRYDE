import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { 
      expiresIn: "7d"
    }
  );
};

export const verifyEmailDomain = (email: string): boolean => {
  const allowedDomains = process.env.EMAIL_DOMAIN_WHITELIST?.split(',') || ['edu'];
  const domain = email.split('@')[1];
  return allowedDomains.some(allowedDomain => domain.endsWith(allowedDomain));
};

export const calculateFareSplit = (totalFare: number) => {
  const platformFeePercentage = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '20');
  const driverFeePercentage = parseInt(process.env.DRIVER_FEE_PERCENTAGE || '80');
  
  const platformFee = (totalFare * platformFeePercentage) / 100;
  const driverFee = (totalFare * driverFeePercentage) / 100;
  
  return {
    totalFare,
    platformFee,
    driverFee
  };
};
