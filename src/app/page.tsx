import Link from 'next/link';

export default async function Home() {
	return (
		<div className="flex p-5 w-full">
			<div className="justify-center w-full">
				<div className="flex gap-5">
					<button>
						<Link href={'/quiz'}>Take the quiz</Link>
					</button>
					<button>
						<Link href={'/login'}>Login</Link>
					</button>
				</div>
			</div>
		</div>
	);
}
