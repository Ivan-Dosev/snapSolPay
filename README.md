# snapSolPay

A mobile-friendly application for analyzing bills and receipts with AI, and with future capability to pay through Solana.

## Features

- **Bill Analysis**: Upload photos of bills and receipts to extract important information
- **AI Processing**: Process bill images using OpenAI's GPT-4o-mini to extract merchant, items, and totals
- **Interactive Item Management**: Select items from your bill and assign them to different contacts
- **Manual Item Addition**: Add missing items that may not have been automatically detected
- **Contact Management**: Add and manage contacts to split bills with friends
- **Drag and Drop**: Simple drag and drop interface for uploading bill images
- **Solana Integration**: Built on Solana blockchain with wallet support for future payment features

## Getting Started

### Prerequisites

- Node v18.18.0 or higher
- Solana wallet for payment features (coming soon)
- OpenAI API key for bill analysis

### Installation

#### Clone the repo

```shell
git clone <repo-url>
cd <repo-name>
```

#### Install Dependencies

```shell
pnpm install
```

#### Environment Setup

Create a `.env.local` file with the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
```

#### Start the web app

```
pnpm dev
```

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: Solana, Anchor
- **AI Analysis**: OpenAI GPT-4o-mini for vision and text analysis
- **File Handling**: Browser-based file upload and processing

## Development Roadmap

- [x] Basic bill analysis functionality
- [x] File upload interface
- [x] OpenAI integration for bill analysis
- [x] Extract and display bill items in table
- [x] Manual item addition for items not detected by AI
- [x] Contact management for bill splitting
- [x] Implement bill payment via Solana
- [ ] Save analysis history


## Usage

1. Open the app in your browser
2. Navigate to the Scanner page
3. Upload a photo of your bill or receipt by:
   - Clicking the upload button to select a file
   - Dragging and dropping an image onto the upload area
   - if you are on a mobile device, you can also take a photo with the device camera
4. Review the uploaded image and submit for analysis
5. View the detailed breakdown of your bill
6. Add any missing items that weren't automatically detected
7. Select items and assign them to different contacts for bill splitting

## Troubleshooting

If you encounter issues with the bill analysis:

1. **No items detected**: Try uploading a clearer image or manually add items using the "Add Missing Item" button
2. **Invalid model error**: Ensure your OpenAI API key is valid and has access to the GPT-4o-mini model
3. **Connection issues**: If accessing via ngrok, try refreshing the connection or restarting the tunnel

## License

This project is licensed under the MIT License - see the LICENSE file for details.
