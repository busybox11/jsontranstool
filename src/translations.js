import * as deepl from 'deepl-node';

export class Translator {
  constructor(config) {
    this.deepl = new deepl.Translator(config.deeplAPIKey)
  }

  async translate(text, targetLang) {
    let translateResult = await this.deepl.translateText(
      text,
      null,
      targetLang,
      { preserveFormatting: true }
    )

    return translateResult
  }
}
