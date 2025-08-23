import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class StaticController {
  @Get('uploads/avatars/:filename')
  serveAvatar(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      
      if (!fs.existsSync(filePath)) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      return res.sendFile(filePath);
    } catch (error) {
      throw new HttpException('Error serving file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}