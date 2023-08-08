export declare const sendMail: (composer: any) => Promise<any>;
export declare function getComposer(to: string, subject: string, html: string): any;
export declare function getTemplateRaw(name: string): Promise<string>;
export declare function getTemplate(mjml: any, variables: any): Promise<string>;
export declare const getEmailOptoutLink: () => string;
