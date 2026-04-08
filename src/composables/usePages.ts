import { ref } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import type { PageData, PageBlock } from "@/types/pageTypes";

export function usePages() {
  const pages = ref<PageData[]>([]);
  const current = ref<PageData>({
    title: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    schemaType: "none",
    schemaCustomJson: "",
    pageStatus: "draft",
    blocks: [],
  });
  const newBlockType = ref<
    "hero" | "text" | "image" | "columns" | "gallery" | "product" | "btn" | "faq" | "form" | "carousel" | "cta-section" | "maps" | "split-content" | "split-content-left" | "split-content-right" | "whatsapp-float"
  >("hero");

  async function loadPages(): Promise<void> {
    const res = await api.get("/pages");
    pages.value = res.data;
  }

  function createPage(): void {
    current.value = {
      title: "",
      slug: "",
      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      schemaType: "none",
      schemaCustomJson: "",
      pageStatus: "draft",
      isHomepage: false,
      blocks: [buildBlock("hero")],
    };
  }

  async function selectPage(page: PageData): Promise<void> {
    current.value = JSON.parse(JSON.stringify(page));
    if (!current.value.pageStatus) current.value.pageStatus = "draft";
  }

  async function setHomepage(page: PageData): Promise<void> {
    if (!page._id) return;
    const result = await Swal.fire({
      title: `Tetapkan "${page.title}" sebagai halaman beranda?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, tetapkan",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    await api.post(`/pages/${page._id}/homepage`);
    await loadPages();
    if (current.value._id === page._id) {
      current.value.isHomepage = true;
    }
    await Swal.fire({
      icon: "success",
      title: "Halaman beranda berhasil diatur",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  async function deletePage(page: PageData): Promise<void> {
    const result = await Swal.fire({
      title: "Hapus halaman ini?",
      text: page.title,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    await api.delete(`/pages/${page._id}`);
    await loadPages();
    if (current.value._id === page._id)
      current.value = {
        title: "",
        slug: "",
        seoTitle: "",
        seoDescription: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImageUrl: "",
        schemaType: "none",
        schemaCustomJson: "",
        pageStatus: "draft",
        blocks: [],
      };
  }

  function addBlock(): void {
    current.value.blocks.push(buildBlock(newBlockType.value));
  }

  function removeBlock(index: number): void {
    current.value.blocks.splice(index, 1);
  }

  function addFaqItem(block: Extract<PageBlock, { type: "faq" }>): void {
    block.items.push({ question: "Pertanyaan baru", answer: "Jawaban baru" });
  }

  function removeFaqItem(
    block: Extract<PageBlock, { type: "faq" }>,
    index: number,
  ): void {
    block.items.splice(index, 1);
  }

  function addColumn(block: Extract<PageBlock, { type: "columns" }>): void {
    block.columns.push({
      columnTitle: `Kolom ${block.columns.length + 1}`,
      blocks: [],
    });
  }

  function addBlockToColumn(
    column: { blocks: PageBlock[] },
    type: PageBlock["type"],
  ): void {
    const newBlock = buildBlock(type);
    column.blocks.push(newBlock);
  }

  function removeBlockFromColumn(
    column: { blocks: PageBlock[] },
    index: number,
  ): void {
    column.blocks.splice(index, 1);
  }

  function removeColumn(
    block: Extract<PageBlock, { type: "columns" }>,
    index: number,
  ): void {
    block.columns.splice(index, 1);
  }

  function addGalleryImage(block: Extract<PageBlock, { type: "gallery" }>): void {
    block.images.push({ assetId: "", caption: "Caption baru" });
  }

  function removeGalleryImage(
    block: Extract<PageBlock, { type: "gallery" }>,
    index: number,
  ): void {
    block.images.splice(index, 1);
  }

  function addCarouselSlide(block: Extract<PageBlock, { type: "carousel" }>): void {
    block.slides.push({
      imageAssetId: "",
      title: "Slide Baru",
      subtitle: "Deskripsi slide baru",
      ctaText: "",
      ctaUrl: "",
    });
  }

  function removeCarouselSlide(
    block: Extract<PageBlock, { type: "carousel" }>,
    index: number,
  ): void {
    block.slides.splice(index, 1);
  }

  async function savePage(): Promise<void> {
    if (!current.value.title || !current.value.slug) {
      await Swal.fire({
        icon: "warning",
        title: "Judul dan slug harus diisi",
        confirmButtonText: "OK",
      });
      return;
    }
    if (current.value._id) {
      await api.put(`/pages/${current.value._id}`, current.value);
    } else {
      await api.post("/pages", current.value);
    }
    await loadPages();
    await Swal.fire({
      icon: "success",
      title: "Halaman tersimpan",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  function moveBlockUp(index: number): void {
    if (index <= 0) return;
    const blocks = current.value.blocks;
    const prev = blocks[index - 1];
    const curr = blocks[index];
    if (prev && curr) {
      blocks[index - 1] = curr;
      blocks[index] = prev;
    }
  }

  function moveBlockDown(index: number): void {
    const blocks = current.value.blocks;
    if (index >= blocks.length - 1) return;
    const next = blocks[index + 1];
    const curr = blocks[index];
    if (next && curr) {
      blocks[index + 1] = curr;
      blocks[index] = next;
    }
  }

  function buildBlock(type: typeof newBlockType.value): PageBlock {
    if (type === "hero")
      return {
        type: "hero",
        title: "Judul Hero",
        subtitle: "Deskripsi hero",
        content: "",
        layout: "centered",
        backgroundImageAssetId: "",
        imageAssetId: "",
        ctaText: "",
        ctaUrl: "",
        id: Date.now(),
      };
    if (type === "text")
      return {
        type: "text",
        title: "Paragraf",
        content: "Tulis konten di sini",
        id: Date.now(),
      };
    if (type === "image")
      return {
        type: "image",
        caption: "Caption gambar",
        imageAssetId: "",
        id: Date.now(),
      };
    if (type === "columns")
      return {
        type: "columns",
        title: "Kolom",
        columns: [
          { columnTitle: "Kolom 1", blocks: [] },
          { columnTitle: "Kolom 2", blocks: [] },
        ],
        id: Date.now(),
      };
    if (type === "gallery")
      return {
        type: "gallery",
        title: "Galeri",
        description: "Kumpulan dokumentasi dan highlight kegiatan/produk kami.",
        images: [{ assetId: "", caption: "Caption gambar" }],
        id: Date.now(),
      };
    if (type === "product")
      return {
        type: "product",
        title: "Produk Pilihan",
        description: "Deskripsi singkat untuk section produk pilihan Anda.",
        productIds: [],
        id: Date.now(),
      };
    if (type === "btn")
      return {
        type: "btn",
        title: "Tombol",
        buttonText: "Klik Saya",
        buttonUrl: "#",
        id: Date.now(),
      };
    if (type === "faq")
      return {
        type: "faq",
        title: "FAQ",
        items: [{ question: "Pertanyaan?", answer: "Jawaban." }],
        id: Date.now(),
      };
    if (type === "form")
      return {
        type: "form",
        title: "Hubungi Kami",
        subtitle: "Punya pertanyaan? Kami siap membantu bisnis Anda.",
        formTargetEmail: "",
        id: Date.now(),
      };
    if (type === "carousel")
      return {
        type: "carousel",
        title: "",
        slides: [
          {
            imageAssetId: "",
            title: "Judul Slide Utama",
            subtitle: "Deskripsi ringkas slide pertama Anda.",
            ctaText: "Mulai",
            ctaUrl: "#",
          },
        ],
        id: Date.now(),
      };
    if (type === "cta-section")
      return {
        type: "cta-section",
        title: "Siap Untuk Memulai?",
        content: "Hubungi tim ahli kami hari ini untuk konsultasi gratis mengenai kebutuhan bisnis Anda.",
        buttonText: "Hubungi Kami",
        buttonUrl: "/contact",
        id: Date.now(),
      };
    if (type === "maps")
      return {
        type: "maps",
        title: "Lokasi Kami",
        description: "Alamat dan petunjuk lokasi kami untuk memudahkan Anda berkunjung.",
        mapEmbedCode: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.56347862248!2d107.5731164!3d-6.9034443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x146050390d6e5066!2sBandung%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1712434000000!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
        id: Date.now(),
      };
    if (type === "split-content" || type === "split-content-left" || type === "split-content-right")
      return {
        type: "split-content",
        title: "Judul Konten",
        content: "Tambahkan deskripsi detail di sini untuk menjelaskan fitur atau layanan Anda.",
        imageAssetId: "",
        layout: type === "split-content-right" ? "right" : "left",
        id: Date.now(),
      };
    if (type === "whatsapp-float")
      return {
        type: "whatsapp-float",
        phoneNumber: "6281234567890",
        message: "Halo, saya ingin bertanya.",
        label: "WhatsApp",
        id: Date.now(),
      };
    return {
      type: "text",
      title: "Paragraf",
      content: "Tulis konten di sini",
      id: Date.now(),
    };
  }

  return {
    pages,
    current,
    newBlockType,
    loadPages,
    createPage,
    selectPage,
    setHomepage,
    deletePage,
    addBlock,
    removeBlock,
    moveBlockUp,
    moveBlockDown,
    addFaqItem,
    removeFaqItem,
    addColumn,
    removeColumn,
    addGalleryImage,
    removeGalleryImage,
    addCarouselSlide,
    removeCarouselSlide,
    addBlockToColumn,
    removeBlockFromColumn,
    savePage,
    buildBlock,
  };
}