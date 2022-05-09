<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>
<p align="center">
  <a href="https://docs.nestjs.cn/" target="blank">中文官网</a>
</p>


## Description

CloverAdmin是一个Nest后台后端解决方案。它借助强大的[Nest](https://github.com/nestjs/nest)和社区快速、轻巧地构建更优雅的Node服务端应用程序。目前已集成权限验证、使用Typeorm的MySql与SqlServer方案、数据验证、文件上传、静态服务等功能。它提供了一个完整的RestFul风格的接口示例。

`node：14.19.0`
`pnpm：6.32.3`

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Start 

建设中。。。

### 跨域

仅需在mian.ts中添加如下配置:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true, // 跨域
});
```

### 全局路由前缀

仅需在mian.ts中添加如下配置:

```ts
app.setGlobalPrefix('api/v1'); // 全局路由前缀
```

### 鉴权

登录注册相关接口在src/core/auth模块下, 

CloverAdmin将验证phone和password字段并检验是否与数据库记录匹配来生成token, 如果需要使用其他字段则在src/core/auth/strategies/local.strategy.ts配置:

```ts
usernameField: 'phone', // 改为你的字段
passwordField: 'password', // 改为你的字段
```

其中验证数据库记录的逻辑是auth.service.ts的validateUser方法, 此方法将依据phone查询数据库记录, 并检查密码是否正确, 最终返回去除password字段的user实体。

jwt中存储的user信息可自行在src/core/auth/strategies/kwt.strategy.ts中配置: 

```ts
async validate(payload: any) {
    console.log('jwt', payload);
    // 此处可以执行其他逻辑操作: 如查询数据以获取完整的user对象
    return { id: payload.sub, phone: payload.phone, roles: payload.role 	}; // 即user的id, phone, role
}
```

jwt密钥在src/core/auth/constants.ts中。

jwt生效时间在src/core/auth/auth.module.ts中配置:

```ts
@Module({
    imports: [
        JwtModule.register({
      		secret: jwtConstants.secret,
      		signOptions: { expiresIn: `${60 * 60}s` }, // 过期时间
    	}),
    ]
})
```

为登录接口使用管道: `@UseGuards(LocalAuthGuard)`, 其他需要验证token的接口使用管道: `@UseGuards(JwtAuthGuard)`，在此之后可直接获取到jwt中的user信息：

```ts
@Post()
@UseGuards(AuthGuard('jwt'))
async createPost(
    @Req() req: any,
): Promise<Result> {
    createInput.user = req.user; // 获取user
}
```

验证token身份之后, 验证用户权限, 权限Role在src/common/enums/role.enum.ts下

首先为接口使用管道: `@UseGuards(RolesGuard) `, 再为接口配置权限`@Roles(Role.ADMIN)`

`ps:`在nest中, 不仅可以为接口(端点)设置管道, 也可以为controller、模块、甚至全局设置管道。

### 数据库

采用[Typeorm](https://github.com/typeorm/typeorm)
文档地址: https://typeorm.bootcss.com/

Nest文档：https://docs.nestjs.cn/8/techniques?id=%e6%95%b0%e6%8d%ae%e5%ba%93

#### 1. 配置连接

ormconfig.json一般放在项目根目录下, 且mysql与sqlserver配置略有不同, 如下

mysql: 

```
// ormconfig.json
{
  "type": "mysql",
  "host": "数据库ip地址",
  "port": 数据库端口号,
  "username": "xxxx",
  "password": "xxxxxx",
  "database": "数据库名",
  "entities": ["dist/feature/**/entities/*.entity{.ts,.js}"],
  "synchronize": true,
  "autoLoadEntities": true
}
```

sqlserver: 

```
// ormconfig.json
{
  "type": "mssql",
  "host": "数据库ip地址",
  "port": 数据库端口号,
  "username": "xxxx",
  "password": "xxxxxx",
  "database": "数据库名",
  "entities": ["dist/feature/**/entities/*.entity{.ts,.js}"],
  "synchronize": true,
  "autoLoadEntities": true,
  "options": { # mssql如果出现ssl问题, 则需要添加此options
    "encrypt": false,
    "trustServerCertificate": true,
    "cryptoCredentialsDetails": {
      "minVersion": "TLSv1"
    }
  }
}
```

注意：Typeorm生成的sql语句可能不支持SqlServer2008，因此可能需要使用QueryBuilder来拼接sql。

#### 2. 在app.module.ts中读取配置

```ts
@Module({
    imports: [
        TypeOrmModule.forRoot()
    ],
    // ...
})
export class AppModule {
  // 注入TypeORM 的Connection对象
  constructor(private readonly connection: Connection) {}
}
```

#### 3. 在其他模块中注册模块中实体

```ts
@Module({
    imports: [
        TypeOrmModule.forFeature([User]) // 注册User实体
    ],
    // ...
    exports: [TypeOrmModule], // 导出模块, 在导入TypeOrmModule.forFeature 的模块之外使用存储库
})
```

接着在user.service.ts中就可以使用User存储库(Repository<User>)以及Connection对象，存储库可以胜任所有数据库操作，而Connection对象用于事务。

```ts
export class UserService {
    constructor(
    	@InjectRepository(User)
    	private usersRepository: Repository<User>,
    	private connection: Connection,
  	) {}
}
```

使用示例：

```ts
// 查询所有user
findAll(): Promise<Array<User>> {
    return this.usersRepository.find();
}
```

更多typeorm操作见typeorm部分, 或typeorm官方文档。

### 校验

[class-validator](https://github.com/typestack/class-validator#validation-messages)

Nest文档：https://docs.nestjs.cn/8/techniques?id=%e9%aa%8c%e8%af%81

使用示例：

```ts
export class User {
    @IsNotEmpty() // 不为空
  	firstName: string;
    @IsString() // 字符串
  	firstName: string;
    @IsMobilePhone('zh-CN', { // 大陆手机号
    	message: '手机号格式不正确', // 自定义验证失败信息
  	})
  	phone: string;
    @IsEnum(Role) // 验证枚举
  	@ValidateIf((o) => o?.role) // 条件验证, 只有当role存在时才验证
  	role?: Role;
}
```

### 静态服务

在app.module.ts中添加配置:

```ts
@Module({
    imports: [
        ServeStaticModule.forRoot({
      		// 配置静态服务目录---访问: http://localhost:3000/client目录内/xxx.png
      		rootPath: join(__dirname, '..', 'client'),
    	}),
    ]
})
```

配置完成后, 所有需要静态访问的静态资源文件均可放在根目录的client(没有则需创建)目录下。

### 文件上传

文件上传后将会保存在client/fileUpload目录下, 也可以在file.module.ts中更改destination进行重新设置。

文件上传有一个专门的模块, 在src/feature/file下, 此功能基于multer实现, 相关的所有配置均在file.module.ts下。

如果在上传文件同时, 希望一同传递其他参数, 请在src/feature/file/dto中进行设置。

### TypeORM



## License

Nest is [MIT licensed](LICENSE).