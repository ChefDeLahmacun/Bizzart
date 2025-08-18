declare module 'iyzipay' {
  export default class Iyzipay {
    constructor(config: {
      apiKey: string;
      secretKey: string;
      uri: string;
    });

    payment: {
      create(request: any, callback: (error: any, result: any) => void): void;
    };
  }
}
