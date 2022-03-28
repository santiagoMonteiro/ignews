import Head from "next/head"
import { GetStaticProps } from "next";

import styles from "./styles.module.scss"

import { createClient } from "../../../primicio";
import { RichText } from "prismic-dom";


export default function Posts({ posts }) {
  return (
    <>
      <Head>
        <title>Posts | ignews</title>
      </Head>
      
      <main className={styles.container}>
        <div className={styles.posts}>
          <a href="#">
            <time>20/03/2022</time>
            <strong>Você sabe o que é React?</strong>
            <p>{posts}</p>
          </a>
          
          <a href="#">
            <time>20/03/2022</time>
            <strong>Você sabe o que é React?</strong>
            <p>Nesse artigo, você verá de forma simples o que é e para que serve o React</p>
          </a>

          <a href="#">
            <time>20/03/2022</time>
            <strong>Você sabe o que é React?</strong>
            <p>Nesse artigo, você verá de forma simples o que é e para que serve o React</p>
          </a>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ previewData }) => {
  const client = createClient({ previewData });

  // const page = await client.getByUID("page", "home");
  const response = await client.getAllByType("post", {
    fetch: ["title", "content"],
    pageSize: 10,
  });

  const posts = response.map((post) => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      excerpt: post.data.slices[0].primary.description.find(chunk => {
        return (chunk.type === "paragraph" && chunk.text?.length > 0);
      }),
    };
  });

  return {
    props: {
      posts,
    },
  }
}
