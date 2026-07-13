/**
 * Conservative hub redeemable points per verified action (tune independently from catalog prices).
 */

/** Minimum KAS-equivalent spend to earn Hub Points on dApp actions. */
export const HUB_POINTS_MIN_SPEND_KAS = 10;

export const HUB_EARN_POINTS = {
  vblogArticleCreate: 120,
  vblogArticleUpdate: 10,
  vblogPremiumUnlock: 50,
  vblogTip: 25,
  vblogPollVote: 20,
  vblogReadingReceipt: 15,
  storeProductList: 100,
  dappDirectoryList: 100,
  hubAdPlacement: 80,
  crowdkasCampaignCreate: 150,
  magazineIssuePublish: 130,
  dappL1Interaction: 25,
  krexNodeOperatorDaily: 15,
  krexNodeEnrollmentOnce: 1000,
  chroniclesArticleCreate: 50,
  chroniclesQuizComplete: 25,
  tokenListingCreate: 100,
  tokenListingUpdate: 15,
  tokenListingVerify: 1000,
  tokensListingVote: 5,
  kpxCovenantDeploy: 60,
  kpxCovenantClaim: 15,
} as const;
