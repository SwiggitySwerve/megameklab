# MegaMekLab Project

This repository contains both the original MegaMekLab Java application and a new web-based BattleTech unit editor built with Next.js.

## Project Structure

- **`/battletech-editor-app`** - Modern web-based BattleTech unit editor (Next.js/React/TypeScript)
  - Full-featured unit customizer and editor
  - SQLite database for unit and equipment data
  - Conversion scripts for MegaMekLab data
  - See [battletech-editor-app/README.md](battletech-editor-app/README.md) for details

- **`/megameklab`** - Original MegaMekLab Java application
  - Classic Java-based unit editor
  - Source data files for conversion

## BattleTech Editor App

The modern web application provides:
- Unit browsing and filtering (Compendium)
- Unit customization and editing
- Equipment database
- Import/Export functionality
- Validation against construction rules

### Quick Start

```bash
cd battletech-editor-app
npm install
npm run dev
```

For production deployment with Docker:
```bash
cd battletech-editor-app
docker-compose up
```

## Original MegaMekLab

MegaMekLab is a Java program for the creation and modification of units for MegaMek. For information about running the Java version, see the sections below.

### Running the Java Version

Java programs run in their own environment, called a Virtual Machine or VM for short. These Java VMs are available on
most systems from a variety of sources.

Windows users: To start MegaMekLab, run the MegaMekLab.exe file. If this fails to start MegaMekLab, see the "INSTALLING
OR UPDATING YOUR JAVA RUNTIME" section, below.

Other graphical OSes: Many other graphical OSes, such as macOS, will allow you to double-click the .jar file to run it.
If this does not work, try running MegaMek from the command line.

Running MegaMekLab from the command line: To do this using Sun Java, or most other implementations, navigate to the
directory containing the .jar file and run: `java -jar MegaMekLab.jar`.

If none of the above options work for you, see the "INSTALLING OR UPDATING YOUR JAVA RUNTIME" section, below.

### INSTALLING OR UPDATING YOUR JAVA RUNTIME

Of the versions available, we now require Java 17 LTS as the bare minimal version. Newer versions should work but are
not currently supported.

#### Adoptium (Windows)

For Windows, follow the instructions [here](https://github.com/MegaMek/megamek/wiki/Updating-to-Adoptium) to ensure Java
is installed correctly for the most seamless experience.

#### Adoptium (Mac)

For Mac, download the installer
from [Adoptium]( https://adoptium.net/temurin/releases/?os=mac&version=17&arch=aarch64&package=jre) directly for your
version of macOS and underling platform (AARCH64 is for M-Series Mac's).

#### Linux

For Linux, your distribution should have a version of Java available via your package manager.

## CUSTOM UNITS

All units (meks, vehicles, infantry, etc.) are located in the data/mekfiles directory. They may be individual files or
zipped up into archives (".zip"), and you may also create subdirectories if you like.

We recommend creating a folder called Customs in the data/mekfiles directory. Then using this folder to store all custom
units.

As of 0.49.13, We've removed the unsupported and unofficial folders. Over the years the unsupported units dropped to
only a couple. The unofficial folder is available
from [the Extras repository](https://github.com/MegaMek/megamek-extras).

### Note of file types

MegaMekLab uses two file types for units. Files with the extension MTF are meks, and all other unit types are BLK files.
Both are editable with a quality text editor, but we recommend not hand editing files as it can break the programs.

## Data Sources

This project includes conversion tools to transform MegaMekLab's MTF and BLK files into a structured database format. The web application uses this converted data to provide a modern interface for unit customization.

## Development

For development setup and contribution guidelines:
- Web app: See [battletech-editor-app/README.md](battletech-editor-app/README.md)
- Java app: See compilation instructions below

### Compiling MegaMekLab (Java)

1) Install [Gradle](https://gradle.org/).
2) Follow the [instructions on the wiki](https://github.com/MegaMek/megamek/wiki/Working-With-Gradle) for using Gradle.

## Support

For bugs, crashes, or other issues you can fill out
a [GitHub issue request](https://github.com/MegaMek/MegaMekLab/issues).

## CONTACT & FURTHER INFORMATION

For more information, and to get the latest version of MegaMek, visit the [website](https://megamek.org).

For more information about the BattleTech board game, visit its [website](https://www.battletech.com).

To submit a bug report, suggestion, or feature request, please visit
our [issue tracker](https://github.com/MegaMek/megameklab/issues)

To discuss all things MegaMek, please visit our [Discord](https://discord.gg/megamek)

## Licensing

MegaMekLab is licensed under a dual-licensing approach:

### Code License

All source code is licensed under the GNU General Public License v3.0 (GPLv3). See the [LICENSE.code](LICENSE.code) file
for details.

### Data/Assets License

Game data, artwork, and other non-code assets are licensed under the Creative Commons Attribution-NonCommercial 4.0
International License (CC-BY-NC-4.0). See the [LICENSE.assets](LICENSE.assets) file for details.

### BattleTech IP Notice

MechWarrior, BattleMech, `Mech, and AeroTech are registered trademarks of The Topps Company, Inc. All Rights Reserved.
Catalyst Game Labs and the Catalyst Game Labs logo are trademarks of InMediaRes Productions, LLC.

The BattleTech name for electronic games is a trademark of Microsoft Corporation.

MegaMek is an unofficial, fan-created digital adaptation and is not affiliated with, endorsed by, or licensed by
Microsoft Corporation, The Topps Company, Inc., or Catalyst Game Labs.

### Full Licensing Details

For complete information about licensing, including specific directories and files, please see the [LICENSE](LICENSE)
document.
