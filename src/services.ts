import {Platform} from "./platforms/platform";
import {Mattermost} from "./platforms/mattermost";
import {Zoom} from "./platforms/zoom";

export const platforms: Platform<any>[] = [
    new Mattermost(),
    new Zoom()
]
