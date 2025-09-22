export const SITE = {
  name: 'Madrasah Aliyah MA MALNU Kananga',
  shortName: 'MA MALNU Kananga',
  tagline: 'Madrasah unggul, religius, dan adaptif digital.',
  url: 'https://ma-malnukananga.sch.id',
  email: 'info@ma-malnukananga.sch.id',
  telephone: '+62-253-234-567',
  foundingYear: '1985',
  logo: 'https://ma-malnukananga.sch.id/icons/icon-512.svg',
  sameAs: [
    'https://facebook.com/mamalnukananga',
    'https://instagram.com/mamalnukananga',
    'https://www.youtube.com/@mamalnukananga'
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Raya Labuan Km. 5 Kananga',
    addressLocality: 'Menes',
    addressRegion: 'Banten',
    postalCode: '42262',
    addressCountry: 'ID'
  }
} as const;

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type SeoOptions = {
  title: string;
  description: string;
  path?: string;
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
};

export const EXTERNAL_SERVICE_DOMAINS = [
  'https://emis.kemenag.go.id',
  'https://vervalpd.data.kemdikbud.go.id',
  'https://simpatika.kemenag.go.id',
  'https://nisn.data.kemdikbud.go.id',
  'https://rdm.ma-malnukananga.sch.id'
] as const;

export const DEFAULT_SHARE_IMAGE = {
  src: 'https://ma-malnukananga.sch.id/icons/icon-512.svg',
  alt: 'Logo MA MALNU Kananga',
  width: 512,
  height: 512
} as const;

export const schoolSchema = {
  '@context': 'https://schema.org',
  '@type': 'School',
  name: SITE.name,
  alternateName: SITE.shortName,
  description: SITE.tagline,
  url: SITE.url,
  email: SITE.email,
  telephone: SITE.telephone,
  foundingDate: SITE.foundingYear,
  logo: SITE.logo,
  sameAs: SITE.sameAs,
  address: SITE.address
};

export const resolveCanonical = (path?: string) => {
  const relativePath = path ?? '/';
  try {
    return new URL(relativePath, SITE.url).toString();
  } catch (error) {
    console.error('Gagal membuat canonical URL:', error);
    return `${SITE.url}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
  }
};

export const createBreadcrumbJsonLd = (items: BreadcrumbItem[]) => {
  const itemList = items.map((item, index) => ({
    '@type': 'ListItem' as const,
    position: index + 1,
    name: item.label,
    item: resolveCanonical(item.href)
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemList
  };
};

export const buildSeo = (options: SeoOptions) => {
  const canonical = resolveCanonical(options.path);
  const shareImage = options.image ?? DEFAULT_SHARE_IMAGE;
  const breadcrumbsJson = options.breadcrumbs?.length
    ? createBreadcrumbJsonLd(options.breadcrumbs)
    : undefined;
  return {
    canonical,
    shareImage,
    breadcrumbsJson,
    noindex: options.noindex ?? false,
    meta: {
      title: options.title,
      description: options.description,
      og: {
        title: options.title,
        description: options.description,
        url: canonical,
        siteName: SITE.shortName,
        image: shareImage
      },
      twitter: {
        title: options.title,
        description: options.description,
        card: 'summary_large_image',
        image: shareImage
      }
    }
  };
};
