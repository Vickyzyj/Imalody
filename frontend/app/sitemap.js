export default function sitemap() {
  const baseUrl = "https://imalody.vercel.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date("2025-11-22"),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    // Add more static pages when ready:
    // {
    //   url: `${baseUrl}/Gallery`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.7,
    // },
  ];
}