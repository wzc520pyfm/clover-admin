import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PhotoService } from './photo.service';
import { Photo, Photo as PhotoEntity } from './entities/photo.entity'; // 可以使用as来为photo指定一个别名
import { Result } from 'src/common/interfaces/result.interface';

@Controller('photos')
export class PhotoController {
  constructor(
    @Inject(PhotoService) private readonly photoService: PhotoService,
  ) {}

  /**
   * 创建一个 photo
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createPost(
    @Req() req: any,
    @Body() createInput: PhotoEntity,
  ): Promise<Result<void>> {
    /**
     * 因为我们在实体中使用了级联,接着在下面为二者建立联系,就仅需要在service中save photo即可, 否则photo和user就需要分别save
     * see: https://github.com/typeorm/typeorm 中的 '使用级联自动保存相关对象'
     */
    createInput.user = req.user; // 连接photo和user
    await this.photoService.create(createInput);
    return { code: 200, message: '创建帖子成功' };
  }

  /**
   * 查询当前用户的所有photo
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: any): Promise<Result<Photo>> {
    const photos = await this.photoService.findAll(req.user.id);
    return { code: 200, message: '查询成功', data: { list: photos } };
  }

  /**
   * 更新指定文章的主体信息
   */
  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateContent(
    @Req() req: any,
    @Body('content') updateContent: string,
    @Param('id') id: number,
  ): Promise<Result<void>> {
    await this.photoService.updateContent(id, updateContent);
    return { code: 200, message: '更新成功' };
  }

  /**
   * 更加复杂的例子
   */
  @Get('common')
  @UseGuards(AuthGuard('jwt'))
  async findAllPhotosAndLimit(
    @Req() req: any,
    @Query('title') title: string,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    // @Param() params: { title?: string; offset?: number; limit?: number },
  ): Promise<Result<Photo>> {
    console.log(req.user.id, title, offset, limit);
    const photos = await this.photoService.findAllPhotosAndLimit(
      req.user.id,
      title,
      offset,
      limit,
    );
    return { code: 200, message: '查询成功', data: { list: photos } };
  }
}
