import { ref } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import type { BlogPost, BlogCategory } from "@/types/blogTypes";

export function useBlog() {
  const posts = ref<BlogPost[]>([]);
  const categories = ref<BlogCategory[]>([]);
  const currentPost = ref<BlogPost>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  async function loadPosts(): Promise<void> {
    const res = await api.get("/blog/posts");
    posts.value = res.data;
  }

  async function loadCategories(): Promise<void> {
    const res = await api.get("/blog/categories");
    categories.value = res.data;
  }

  function createNewPost(): void {
    currentPost.value = {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function selectPost(post: BlogPost): Promise<void> {
    currentPost.value = JSON.parse(JSON.stringify(post));
  }

  async function savePost(): Promise<void> {
    if (!currentPost.value.title || !currentPost.value.slug) {
      await Swal.fire({
        icon: "warning",
        title: "Judul dan slug harus diisi",
        confirmButtonText: "OK",
      });
      return;
    }

    currentPost.value.updatedAt = new Date().toISOString();

    if (currentPost.value._id) {
      await api.put(`/blog/posts/${currentPost.value._id}`, currentPost.value);
    } else {
      await api.post("/blog/posts", currentPost.value);
    }

    await loadPosts();
    await Swal.fire({
      icon: "success",
      title: "Artikel tersimpan",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  async function deletePost(post: BlogPost): Promise<void> {
    const result = await Swal.fire({
      title: "Hapus artikel ini?",
      text: post.title,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    await api.delete(`/blog/posts/${post._id}`);
    await loadPosts();
    
    await Swal.fire({
      icon: "success",
      title: "Artikel dihapus",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  return {
    posts,
    categories,
    currentPost,
    loadPosts,
    loadCategories,
    createNewPost,
    selectPost,
    savePost,
    deletePost,
  };
}
