# Code Review & Critical Issue Analysis

## Identify issues across the codebase, Categorize each issue by severity: Critical / Major / Minor, Provide exact file path and line number for each issue, Explain the real‑world impact — what breaks for actual users, Provide a concrete fix or refactor direction for each issue, Identify issues spanning multiple layers: backend → frontend → API

* Issue 1:
  * ** **Severity**: Major
  * **File Path/Line number**: api-service\src\app\common\guards\permissions.guard.ts
  * **Identification**: It will not scale well if this guard runs on many routes. The main issue is performance and duplication of data per request. PermissionGuard in nestjs project always query user role from the database every time the guard executes. Permissions don't change often, but it recompute in the for loop (for (const userRole of userRoles))
  * **Real world impact**: for every protected route call, you are hitting the database with and recomputing permissions causing unnecessary load on the database and the backend, increasing latency and scalability reducing user experience
  * **Concrete fix/Refactor direction**: The fix would be to implement a redis store to cache permissions for each userId and invalidate the cache based on userId if that user's role is changed/deleted. For best practice instead of fetching permissions in Guard, we have to move the fetch function to service since it is calling to the DB to adhere to Single Responsibility Princible.
  * **Issue Spanning Layers**: 10 Users call API Request from front-end -> 10 API Requests hit a protected route with Guard in back-end -> back-end call getUserPermissions and query from DB 10 times -> back-end recompute permission 10 times -> Permission check

* Issue 2:
  * ** **Severity**: Critical
  * **File Path/Line number**: api-service\src\app\otp\otp.service.ts
  * **Identification**: [1]OTP is being stored as plaintext in DB. [2]On line 20 OTP is logged in the console without any obfuscation regardless of dev or prod environment. [3]No rate limiting for OTP. [4]No clean up of expired OTPs
  * **Real world impact**: [1]If anyone can access to the database they can just get the OTP code and impersonate as other users and execute malicious actions because it is not hashed. [2]If anyone has access to the logs (cloud logs, monitoring tools, CI/CD logs) they can also intercept the OTP and do the same thing as the previous issue. [3]Even if the app level or the deployment level has rate limiting, OTP limits should still be much less to prevent them from being brute force. [4]After a while the otpVerification table will become so large with so much data that it will slow the database down and make it bloated without clean up of expired OTPs
  * **Concrete fix/Refactor direction**: [1]Use await bcrypt.hash function to hash the OTP code and save it to the DB instead of plaintext. [2]Remove the line 20 entirely or if you really need to debug then add a check condition to only log if the environment is development, check if process.env.NODE_ENV === "development". [3]add attemps column to otpVerification table and in verifyOtp method remove 'code' column in where query. compare with using bcrypt.compare(dto.code, record.code), if it doesn't match, increase the attempts and check if attempts is higher than the limit you specified to throw Exception. [4]Create a cron job that run weekly or even daily to delete rows with expired OTPs
  * **Issue Spanning Layers**: A user request an OTP in the front-end -> Back-end OTPService generate an OTP code but log in the console or save to DB in plaintext -> Attacker intercept by infiltrating DB or Logs -> they can impersonate that user and perform malicious actions.

* Issue 3:
  * ** **Severity**: Major
  * **File Path/Line number**: api-service\src\app\prisma.service.ts
  * **Identification**: PrismaService is instantiated multiple times by NestJS when any module import it, everytime it's created execSync is executed again. PrismaService will be created again so migrations will be ran multiple times
  * **Real world impact**: Not only does this block app startup every time it is redeployed and won't even start if migration has an error in it, It is risky in multi-instance deployment (Kubernetes, PM2, etc.), every pod inside Kubernetes will run it again, causing race conditions
  * **Concrete fix/Refactor direction**: Create a GlobalPrisma module and import it in AppModule once, remove all imports of PrismaServices from providers in modules that use it so that it only run once, but a better and more standard way is to remove migration from app completely and separate it into a script command in packages.json like this
  
  ```json
  "scripts": { "db:migrate": "prisma migrate deploy"}
  ```

  then execute this command in a CI/CD pipeline so that it wouldn't effect app startup
  * **Issue Spanning Layers**:

* Issue 4:
  * ** **Severity**: Minor
  * **File Path/Line number**: front-management\src\app\shared\components\data-table\data-table.component.ts - at getCellDateValue method in line 366
  * **Identification**: If the date is null the table cell will be displayed as "Invalid Date"
  * **Real world impact**: Not much of a big impact but can cause some user experience issue
  * **Concrete fix/Refactor direction**: Change the function to check type correctly. Return null for invalid Date objects, return null for empty strings, parse string/number dates safely and return null when invalid (getTime function is supposed to return a number which is the current time in miliseconds so we check if it's a number),

  ```ts
  getCellDateValue(row: T, column: TableColumn<T>): Date | string | null {
    const value = this.getCellValue(row, column);
    if (value === null || value === undefined) return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      if (typeof value === 'string' && value.trim() === '') return null;
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }
  ```

  * **Issue Spanning Layers**: Back-end return null date field -> Front-end display "Invalid Date" -> Cause confusion to users

* Issue 5:
  * ** **Severity**: Minor
  * **File Path/Line number**: api-service\src\app\auth\strategies\google.strategy.ts & api-service\src\app\auth\strategies\kakao.strategy.ts
  * **Identification**: if GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/KAKAO_CLIENT_ID/KAKAO_CLIENT_SECRET in .env file are missing the nestJS project won't start because the 2 strategy file will throw an error when initializing at startup, making a nuisance for the developers
  * **Real world impact**: Can cause some annoyance to developer who doesn't add the clientId and clientSecret
  * **Concrete fix/Refactor direction**: In auth.module.ts provider replace GoogleStategy with this in order to warn but as the same time doesn't block the app form starting when there is no value provided

  ```ts
  {
    provide: GoogleStrategy,
    useFactory: (configService: ConfigService) => {
      const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        console.warn('missing Google OAuth config');
        return null;
       }
        return new GoogleStrategy(configService);
      },
      inject: [ConfigService],
    },
    ```

  * **Issue Spanning Layers**:

* Issue 6:
  * ** **Severity**: Critical
  * **File Path/Line number**: api-service\src\app\auth\auth.controller.ts - line 50 at getFrontendUrlFromHost method & line 167 at googleAuthCallback method & line 304 at kakaoAuthCallback method, getAuthenticateOptions in api-service\src\app\auth\guards\google-auth.guard.ts and api-service\src\app\auth\guards\kakao-auth.guard.ts
  * **Identification**: [1]The host header is trusted in *KakaoAuthGuard.getAuthenticateOptions* & *GoogleAuthGuard.getAuthenticateOptions* & *AuthController.getFrontendUrlFromHost* meaning any hosts are allowed which is an Host Header Injection & Open Redirect vulneribility. [2]access_token is return in url query which is visible (logged in server logs, stored in browser history, sent in referrer header to other sites). [3]User data in url query params. [4]No CSRF protection for OAuth because state parameter is missing in GoogleStrategy and KakaoStrategy. [5]No rate limiting on OAuth endpoints
  * **Real world impact**: [1]Because the host header is user-controller and the getFrontendUrlFromHost trust any host headers, attackers inject host header from their site by phishing you [2]then when your server redirect to their site and they can steal your access_token easily since it is in the URL query params. [3]Sending user data along in url query params can cause issues like large payload in url and can be tampered with on the client side. [4]Attackers can trick you to login with their's accounts and when you do you can mistakenly type in your personal data for them to steal. [5]Attacker can spam redirects
  * **Concrete fix/Refactor direction**: [1]Only whitelist allowed domains in *KakaoAuthGuard.getAuthenticateOptions* & *GoogleAuthGuard.getAuthenticateOptions* & *AuthController.getFrontendUrlFromHost* method

  ```ts
  const allowedHosts = ['yourdomain.com', 'admin.yourdomain.com'];
  if (!allowedHosts.includes(host)) {
    return defaultUrl;
  }
  ```
  
  [2]Use http-only cookie for access_token as well and then redirect like this ```res.redirect(`${frontendUrl}/login?success=true`);```. [3]For user data after getting access_token in cookie just fetch profile API endpoint. [4]Add state into KakaoStrategy and GoogleStrategy constructor. [5]Use guards decorator on oauth endpoints for rate limiting
  * **Issue Spanning Layers**: User got phished to login to google/kakao on the front-end but on the attacker site that impersonate as your -> Back-end server build the redirect url to their site with all the user data and access_token in url query -> Attacker capture your access_token from URL and impersonate as you

* Issue 7:
  * ** **Severity**: Critical
  * **File Path/Line number**: nginx\proxy.conf & nginx\frontend.conf
  * **Identification**: Even through this belong in the realm of devops I have to point out that there are some issue with the nginx config file. [1]There are no HTTPS configure with SSL certificate. [2]There is no control on the payload size allowed to send to the server. [3]The front-end proxy are not rate limited like the back-end proxy
  * **Real world impact**: [1]If your site is deployed and served with only http then the data traffic won't be encrypted, that mean any traffic between the client and server will be susceptible to MITM (Man in the middle) attack and session hijacking
  * **Concrete fix/Refactor direction**: [1]If possible use lets encrypt with certbot to create ssl certificates, liste to port 443 on the first server block and add certificate paths, create another server block to listen for port 80 so when a request is sent to port 80 it can redirect the request to port 443 (which is https). [2]The default max payload nginx will accept is 1MB, but if you need to send multiple image to the server that exceedss 1MB it will cause an error. [3]Without rate limit on the front-end proxy the nginx server might send html & assets & javascript files without limit to the client which can cause the nginx server to be under heavy load and might even crash if there are any DDOS attemps.

  ```md
  server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  }  
  server {
    if ($host = domain.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name domain.com;
    return 404;
  }
  ```

  [2]add client_max_body_size 10M; to specify the maximum body size your nginx server can accept. [3]Just add the same line as the back-end proxy but with more burst ```limit_req zone=api_limit burst=50 nodelay;```

  * **Issue Spanning Layers**: Nginx serve your website through http -> Any traffic between client and server are not encrypted -> attacker can intercept request with MITM attack -> attacker steal all user information

## Select your top 3 most critical issues and justify why

* Top 1: The host header is trusted & access_token in URL query meaning any hosts are allowed which is an Host Header Injection & Open Redirect vulneribility
  * Reason: This vulneribility make it easy for attacker to steal your account all they have to do is setup another website of their own and they can just phish you into mistakenly give them your access token which they can use to change your password

* Top 2: OTP is being stored as plaintext or logged in the console without any obfuscation
  * Reason: This make it that if an attacker can access the logs or the database they can see your OTP code, which they can use to verify themselves through an API endpoint before you could and perform malicious actions on your behalf

* Top 3: In Nginx server there are no HTTPS configure with SSL certificate
  * Reason: If you don't configure HTTPS on your server all of your users will be in danger of having their information/account stolen since HTTP doesn't encrypt web traffic it will be susceptible to MITM attack where the attacker makes independent connections with the victims and relays messages between them. this can lead to malicious content injection or redirection to fraudulent sites

## Propose CI/CD checks or lint rules preventing recurrence

* Install ESLint security rules, this catches unsafe regex, injection patterns, some dynamic URL risks
* Install SonarQube to ensure continuous code quality and code security on your codebase. It provides continuous inspection of code quality to perform automatic reviews with static analysis of code to detect bugs, vulnerabilities, security hotspots

## Provide a 1‑week sprint plan to address issues

**Day 1:** Optimize PermissionGuard to cache user's permissions
**Day 2:** Hash OTP code before saving, fix or remove OTP logging, add rate limiting for OTP, create cron jobs to clean up expired OTPs
**Day 3:** Separate migration from back-end PrismaService into a ci/cd pipeline  
**Day 4:** update table UI to check for type correctly & add customize auth providers
**Day 5:** Add allow list for only whitelist domain, no longer trust host header, remove access_token from URL query
**Day 6:** Add CSRF protection to OAuth routes, Add rate limiting to OAuth routes
**Day 7:** Install SSL certificate and configure nginx config file, add payload limit to the config, add rate limiting to front-end proxy