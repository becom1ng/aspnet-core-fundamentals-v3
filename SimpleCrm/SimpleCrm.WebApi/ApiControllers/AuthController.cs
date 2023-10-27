﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SimpleCrm.WebApi.Auth;
using SimpleCrm.WebApi.Models.Auth;

namespace SimpleCrm.WebApi.ApiControllers
{

    [Route("api/auth")]
    public class AuthController : Controller
    {
        private readonly UserManager<CrmUser> _userManager;
        private readonly IJwtFactory _jwtFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly MicrosoftAuthSettings _microsoftAuthSettings;

        public AuthController(UserManager<CrmUser> userManager, IJwtFactory jwtFactory, IConfiguration configuration, ILogger<AuthController> logger, IOptions<MicrosoftAuthSettings> microsoftAuthSettings)
        {
            _userManager = userManager;
            _jwtFactory = jwtFactory;
            _configuration = configuration;
            _logger = logger;
            _microsoftAuthSettings = microsoftAuthSettings.Value;
        }

        [HttpGet("external/microsoft")]
        public IActionResult GetMicrosoft()
        {   // only needed for the client to know what to send to Microsoft on the front-end redirect to login with Microsoft
            return Ok(new
            {   //this is the public application id, don't return the secret 'Password' here!
                client_id = _microsoftAuthSettings.ClientId,
                scope = "https://graph.microsoft.com/user.read",
                state = "" //arbitrary state to return again for this user
            });
        }

        [HttpPost("external/microsoft")]
        public async Task<IActionResult> PostMicrosoft([FromBody] MicrosoftAuthViewModel model)
        {
            var verifier = new MicrosoftAuthVerifier<AuthController>(_microsoftAuthSettings, _configuration["HttpHost"] + (model.BaseHref ?? "/"), _logger);
            var profile = await verifier.AcquireUser(model.AccessToken);

            // validate the 'profile' object is successful, and email address is included
            if (!profile.IsSuccessful)
            {
                return BadRequest(); // 400 - TODO? Provide an error message.
            }
            if (String.IsNullOrWhiteSpace(profile.Mail)) 
            {
                return Forbid("Email address not available from provider."); // 403
            }

            // verify UserLoginInfo
            var info = new UserLoginInfo("Microsoft", profile.Id, "Microsoft");
            if (info == null || String.IsNullOrWhiteSpace(info.ProviderKey))
            {
                return BadRequest(); // 400 - TODO? Provide an error message.
            }

            // ready to create the LOCAL user account (if necessary) and jwt
            var user = await _userManager.FindByEmailAsync(profile.Mail);
            if (user == null)
            {
                // create a new user
                var newUser = new CrmUser
                {
                    UserName = profile.Mail,
                    Email = profile.Mail,
                    DisplayName = profile.DisplayName,
                    PhoneNumber = profile.MobilePhone
                };

                // generate password - #1aA ensures all required character types will be in the random password
                var password = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Substring(0, 8) + "#1aA";
                var createResult = await _userManager.CreateAsync(newUser, password);
                if (!createResult.Succeeded)
                {
                    return StatusCode(StatusCodes.Status400BadRequest, "Could not create user.");
                }

                // final verification that new local user can be found
                user = await _userManager.FindByEmailAsync(profile.Mail);
                if (user == null)
                {
                    return StatusCode(StatusCodes.Status400BadRequest, "Failed to create local user account.");
                }
            }

            var userModel = await GetUserData(user);
            return Ok(userModel);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Post([FromBody] CredentialsViewModel credentials)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var user = await Authenticate(credentials.EmailAddress, credentials.Password);
            if (user == null) 
                return UnprocessableEntity("Invalid username or password.");

            var userModel = await GetUserData(user);
            // returns a UserSummaryViewModel containing a JWT and other user info
            return Ok(userModel);
        }

        [Authorize(Policy = "ApiUser")] // policy created in startup.cs
        [HttpPost("verify")] // POST api/auth/verify
        public async Task<IActionResult> Verify()
        {
            if (User.Identity.IsAuthenticated)
            {

                // TODO: figure this out as part of the assignment
                var userId = User.Claims.Single(c => c.Type == "id");
                var user = _userManager.Users.FirstOrDefault(x => x.Id.ToString() == userId.Value);
                if (user == null)
                    return Forbid();

                var userModel = await GetUserData(user);
                return new ObjectResult(userModel);
            }

            return Forbid();
        }


        private async Task<CrmUser> Authenticate(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return await Task.FromResult<CrmUser>(null);

            // get the user
            var userToVerify = await _userManager.FindByEmailAsync(email); // TODO? Set identity option: require unique email
            if (userToVerify == null) 
                return await Task.FromResult<CrmUser>(null);

            // check the password for the user
            if (await _userManager.CheckPasswordAsync(userToVerify, password)) 
                return await Task.FromResult(userToVerify);

            // Credentials are invalid, or account doesn't exist
            return await Task.FromResult<CrmUser>(null);
        }

        private async Task<UserSummaryViewModel> GetUserData(CrmUser user)
        {
            if (user == null) return null;

            // generate the jwt for the local user
            var jwt = await _jwtFactory.GenerateEncodedToken(user.UserName,
                _jwtFactory.GenerateClaimsIdentity(user.UserName, user.Id.ToString()));

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count == 0) { roles.Add("prospect"); }

            var userModel = new UserSummaryViewModel
            {   //JWT could inject all these properties instead of creating a model,
                //but a model is a little easier to access from client code without
                //decoding the token. When this user model starts to contain arrays
                //of complex data, including it all in the JWT value can get complicated.
                Id = user.Id,
                Name = user.DisplayName,
                EmailAddress = user.Email,
                JwtToken = jwt,
                Roles = roles.ToArray(), //each role could be a separate claim in the JWT
                AccountId = 0 //TODO: load this from registration data
            };

            return userModel;
        }
    }
}