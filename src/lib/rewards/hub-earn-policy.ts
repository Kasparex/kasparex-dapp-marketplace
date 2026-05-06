/**
 * Conservative hub redeemable points per verified action (tune independently from catalog prices).
 */

export const HUB_EARN_POINTS = {
  vblogArticleCreate: 120,
  vblogArticleUpdate: 40,
  storeProductList: 100,
  hubAdPlacement: 80,
  crowdkasCampaignCreate: 150,
  magazineIssuePublish: 130,
  dappL1Interaction: 25,
  krexNodeOperatorDaily: 15,
  krexNodeEnrollmentOnce: 200,
} as const;
