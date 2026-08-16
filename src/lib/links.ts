// フッタリンク(F-10)。歩き方=操作説明・設計図はアーティファクト(要共有リンク)。

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/kobai-walk/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/kobai-walk" },
  {
    label: "kobai-walk の歩き方",
    href: "https://claude.ai/code/artifact/a9f11581-ac5c-40d7-b6fb-6afc4f73666a",
  },
  {
    label: "kobai-walk 設計図",
    href: "https://claude.ai/code/artifact/57f09382-c1f4-433d-a964-0a0b35488944",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
