const axios = require('axios');
const FormData = require('form-data');

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST allowed"
    });
  }

  try {
    const { text, vachana_api_key, upload_api_key } = req.body;

    if (!text || !vachana_api_key || !upload_api_key) {
      return res.status(400).json({
        error: "text, vachana_api_key, upload_api_key are required"
      });
    }

    // 🔹 Step 1: Generate TTS
    const ttsResponse = await axios.post(
      'https://api.vachana.ai/api/v1/tts/inference',
      {
        audio_config: {
          bitrate: "192k",
          container: "mp3",
          encoding: "linear_pcm",
          num_channels: 1,
          sample_rate: 44100,
          sample_width: 2
        },
        model: "vachana-voice-v2",
        text: text,
        voice: "sia"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': vachana_api_key
        },
        responseType: 'arraybuffer'
      }
    );

    // 🔹 Step 2: Upload audio
    const formData = new FormData();
    formData.append('phone_number', '919217090193');
    formData.append('file', ttsResponse.data, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });

    const uploadResponse = await axios.post(
      'https://api.onexaura.com/wa/mediaupload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'apikey': upload_api_key,
          'accept': 'application/json'
        }
      }
    );

    return res.status(200).json({
      success: true,
      mediaUrl: uploadResponse.data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed",
      details: error.response?.data || error.message
    });
  }
};
