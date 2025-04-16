import { useNavigate } from "@remix-run/react";
import { IndexTable, Thumbnail } from "@shopify/polaris";
import { formatDate } from "app/common";

type argOfCustomIndexTable = {
  data: GalleryType;
  index: number;
  selectedBool: boolean | "indeterminate" | undefined;
};

export default function CustomRowIndexTabel({
  data,
  index,
  selectedBool,
}: argOfCustomIndexTable) {
  const navigate = useNavigate();
  const date = formatDate(data.createdAt, false);

  return (
    <IndexTable.Row
      id={data._id}
      key={data._id}
      selected={selectedBool}
      position={index}
      onClick={() => {
        navigate(`/app/gallery/${data._id}`);
      }}
    >
      <IndexTable.Cell>
        <Thumbnail
          source={
            data.imageUrl ??
            "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
          }
          size="medium"
          alt="Black choker necklace"
        />
      </IndexTable.Cell>
      <IndexTable.Cell>{data.title}</IndexTable.Cell>
      <IndexTable.Cell>{date}</IndexTable.Cell>
      <IndexTable.Cell>{data.hotspots.length}</IndexTable.Cell>
    </IndexTable.Row>
  );
}
