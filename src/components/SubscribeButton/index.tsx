import { useSession, signIn } from 'next-auth/react'
import { useRouter } from "next/router";

import { api } from '../../services/api'
import { getStripeJs } from '../../services/stripe-js'

import styles from './styles.module.scss'

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const { data: activeSession } = useSession();
  const router = useRouter();

  async function handleSubscribe() {
    if (!activeSession) {
      signIn('github');
      return;
    }

    if (activeSession.activeSubscription) {
      router.push("/posts");
      return;
    }

    try {
      const response = await api.post('/subscribe');

      const { sessionId } = response.data;

      const stripeJs = await getStripeJs();

      await stripeJs.redirectToCheckout({ sessionId });

    } catch(err) {
      alert(err.message);
    }
  }

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  )
}
