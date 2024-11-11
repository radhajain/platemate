import { Metadata, ResolvingMetadata } from 'next';

type UserProfileProps = {
	params: { username: string };
};

export async function generateMetadata(
	{ params: { username } }: UserProfileProps,
	parent: ResolvingMetadata
): Promise<Metadata> {
	return {
		title: username,
		description: `${username}'s profile`,
		icons: (await parent).icons,
	};
}

export default async function UserProfile({
	params: { username },
}: UserProfileProps) {
	return (
		<div>
			<div>{username}</div>
			<div>This week</div>
			<div className="flex gap-5">
				<div>Grocery list</div>
				<div>Recipes</div>
			</div>
			<div>Liked recipes:</div>
		</div>
	);
}
