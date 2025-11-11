# Install Cloudinary Package

Run this command in the `server` folder to install the Cloudinary SDK:

```bash
npm install
```

This will install the `cloudinary` package that was added to `package.json`.

## Verify Installation

After running `npm install`, check that Cloudinary is installed:

```bash
npm list cloudinary
```

You should see:
```
cogel-sync-server@1.0.0
└── cloudinary@2.5.1
```

## Next Steps

1. Create Cloudinary account at https://cloudinary.com
2. Get your credentials from dashboard
3. Add credentials to Render environment variables
4. Deploy to Render

See `CLOUDINARY_SETUP_GUIDE.md` in the root folder for complete setup instructions.
