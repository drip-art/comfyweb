export const defaultWorkflow = {
  last_node_id: 11,
  last_link_id: 12,
  nodes: [
    {
      id: 8,
      type: 'VAEDecode',
      pos: [1230, 210],
      size: {
        '0': 140,
        '1': 60,
      },
      flags: {},
      order: 6,
      mode: 0,
      inputs: [
        {
          name: 'samples',
          type: 'LATENT',
          link: 7,
        },
        {
          name: 'vae',
          type: 'VAE',
          link: 12,
        },
      ],
      outputs: [
        {
          name: 'IMAGE',
          type: 'IMAGE',
          links: [9],
          slot_index: 0,
        },
      ],
      properties: {
        'Node name for S&R': 'VAEDecode',
      },
    },
    {
      id: 4,
      type: 'CheckpointLoaderSimple',
      pos: [20, 210],
      size: {
        '0': 340,
        '1': 100,
      },
      flags: {},
      order: 0,
      mode: 0,
      outputs: [
        {
          name: 'MODEL',
          type: 'MODEL',
          links: [1],
          slot_index: 0,
        },
        {
          name: 'CLIP',
          type: 'CLIP',
          links: [3, 5],
          slot_index: 1,
        },
        {
          name: 'VAE',
          type: 'VAE',
          links: [],
          slot_index: 2,
        },
      ],
      properties: {
        'Node name for S&R': 'CheckpointLoaderSimple',
      },
      widgets_values: ['v1-5-pruned-emaonly.safetensors'],
    },
    {
      id: 9,
      type: 'SaveImage',
      pos: [1420, 210],
      size: {
        '0': 410,
        '1': 460,
      },
      flags: {},
      order: 7,
      mode: 0,
      inputs: [
        {
          name: 'images',
          type: 'IMAGE',
          link: 9,
        },
      ],
      properties: {},
      widgets_values: ['Result'],
    },
    {
      id: 6,
      type: 'CLIPTextEncode',
      pos: [430, 70],
      size: {
        '0': 370,
        '1': 160,
      },
      flags: {},
      order: 3,
      mode: 0,
      inputs: [
        {
          name: 'clip',
          type: 'CLIP',
          link: 3,
        },
      ],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [4],
          slot_index: 0,
        },
      ],
      title: 'CLIP Text Encode (Positive)',
      properties: {
        'Node name for S&R': 'CLIPTextEncode',
      },
      widgets_values: [
        'a closeup photo of a woman eating gelato in Italy\n\nhigh resolution, detailed, 4k, professional photography, diffuse light',
      ],
      color: '#232',
      bgcolor: '#353',
    },
    {
      id: 7,
      type: 'CLIPTextEncode',
      pos: [430, 290],
      size: {
        '0': 370,
        '1': 160,
      },
      flags: {},
      order: 4,
      mode: 0,
      inputs: [
        {
          name: 'clip',
          type: 'CLIP',
          link: 5,
        },
      ],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [6],
          slot_index: 0,
        },
      ],
      title: 'CLIP Text Encode (Negative)',
      properties: {
        'Node name for S&R': 'CLIPTextEncode',
      },
      widgets_values: ['(embedding:UnrealisticDream:1.2), embedding:BadDream'],
      color: '#322',
      bgcolor: '#533',
    },
    {
      id: 5,
      type: 'EmptyLatentImage',
      pos: [580, 510],
      size: {
        '0': 220,
        '1': 106,
      },
      flags: {},
      order: 1,
      mode: 0,
      outputs: [
        {
          name: 'LATENT',
          type: 'LATENT',
          links: [2],
          slot_index: 0,
        },
      ],
      properties: {
        'Node name for S&R': 'EmptyLatentImage',
      },
      widgets_values: [512, 512, 1],
    },
    {
      id: 11,
      type: 'VAELoader',
      pos: [880, 520],
      size: {
        '0': 300,
        '1': 60,
      },
      flags: {},
      order: 2,
      mode: 0,
      outputs: [
        {
          name: 'VAE',
          type: 'VAE',
          links: [12],
          shape: 3,
          slot_index: 0,
        },
      ],
      properties: {
        'Node name for S&R': 'VAELoader',
      },
      widgets_values: ['vae-ft-mse-840000-ema-pruned.safetensors'],
    },
    {
      id: 3,
      type: 'KSampler',
      pos: [880, 210],
      size: {
        '0': 300,
        '1': 262,
      },
      flags: {},
      order: 5,
      mode: 0,
      inputs: [
        {
          name: 'model',
          type: 'MODEL',
          link: 1,
        },
        {
          name: 'positive',
          type: 'CONDITIONING',
          link: 4,
        },
        {
          name: 'negative',
          type: 'CONDITIONING',
          link: 6,
        },
        {
          name: 'latent_image',
          type: 'LATENT',
          link: 2,
        },
      ],
      outputs: [
        {
          name: 'LATENT',
          type: 'LATENT',
          links: [7],
          slot_index: 0,
        },
      ],
      properties: {
        'Node name for S&R': 'KSampler',
      },
      widgets_values: [8, 'fixed', 20, 7, 'dpmpp_2m', 'karras', 1],
    },
  ],
  links: [
    [1, 4, 0, 3, 0, 'MODEL'],
    [2, 5, 0, 3, 3, 'LATENT'],
    [3, 4, 1, 6, 0, 'CLIP'],
    [4, 6, 0, 3, 1, 'CONDITIONING'],
    [5, 4, 1, 7, 0, 'CLIP'],
    [6, 7, 0, 3, 2, 'CONDITIONING'],
    [7, 3, 0, 8, 0, 'LATENT'],
    [9, 8, 0, 9, 0, 'IMAGE'],
    [12, 11, 0, 8, 1, 'VAE'],
  ],
  groups: [],
  config: {},
  extra: {},
  version: 0.4,
}
